import { config } from "../config/env.js";
import { recordIndexerSuccess, recordIndexerFailure } from "../db/sqlite.js";
import { TrackerHealthManager, ProwlarrIndexer } from "../health/tracker.js";

export interface ProwlarrSearchResult {
  title: string;
  size: number;
  seeders: number;
  peers: number;
  magnetUrl?: string;
  downloadUrl?: string;
  indexer: string;
  infoHash?: string;
}

export class ProwlarrClient {
  private url: string;
  private apiKey: string;
  private logger: any;

  constructor(logger: any) {
    this.url = config.PROWLARR_URL;
    this.apiKey = config.PROWLARR_API_KEY;
    this.logger = logger;
  }

  /**
   * Verifies FlareSolverr connectivity and logs setup guidance.
   * Treats FlareSolverr as an optional enhancement.
   */
  async verifyFlareSolverrConnectivity(): Promise<boolean> {
    if (!config.FLARESOLVERR_ENABLED) {
      this.logger.info("FlareSolverr integration is disabled (FLARESOLVERR_ENABLED=false).");
      return false;
    }
    const checkUrl = `${config.FLARESOLVERR_URL}/health`;
    this.logger.info({ url: config.FLARESOLVERR_URL }, "Checking FlareSolverr availability...");
    
    try {
      const response = await fetch(checkUrl, { method: "GET" });
      if (response.ok) {
        this.logger.info({ url: config.FLARESOLVERR_URL }, "FlareSolverr connection verified. Host is online.");
        return true;
      } else {
        this.logger.warn({ status: response.status, url: checkUrl }, "FlareSolverr returned a non-OK response.");
        this.logger.info("Setup Guidance: Add FlareSolverr as a proxy in Prowlarr UI (Settings > Indexer Proxies > Add FlareSolverr) pointing to http://flaresolverr:8191 (or localhost if running locally) and tag protected indexers.");
        return false;
      }
    } catch (err: any) {
      this.logger.warn({ url: checkUrl, error: err.message }, "FlareSolverr is unreachable. Bypassing Optional proxy.");
      this.logger.info("Setup Guidance: Ensure your FlareSolverr container is running and healthy in docker-compose.yml. In Prowlarr UI, go to Settings > Indexer Proxies, add a new FlareSolverr proxy pointing to your FlareSolverr container URL, and tag protected indexers.");
      return false;
    }
  }

  /**
   * Queries Prowlarr for search results using the generated query.
   */
  async search(query: string, type: "movie" | "series"): Promise<ProwlarrSearchResult[]> {
    if (!this.apiKey) {
      this.logger.warn("Prowlarr search called but PROWLARR_API_KEY is not configured.");
      return [];
    }

    const baseUrl = this.url.endsWith("/") ? this.url.slice(0, -1) : this.url;
    const categories = type === "movie" ? [2000] : [5000];

    // 1. Fetch indexers to check status and sync health
    let indexersList: ProwlarrIndexer[] = [];
    try {
      const indexerUrl = `${baseUrl}/api/v1/indexer`;
      const response = await fetch(indexerUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
          "Accept": "application/json"
        }
      });
      if (response.ok) {
        indexersList = await response.json();
        
        // Synchronize Prowlarr's own indexer status checks with our SQLite db
        for (const idx of indexersList) {
          if (idx && idx.enable && idx.protocol === "torrent" && idx.name) {
            // Guard: Undefined/null/missing status is treated as perfectly healthy/neutral
            if (idx.status !== undefined && idx.status !== null) {
              const statusStr = String(idx.status).toLowerCase().trim();
              // Only treat explicit negative health states (error/warning/failed) as failures
              const isExplicitFailure = statusStr === "error" || statusStr === "warning" || statusStr === "failed" || statusStr === "unhealthy";
              if (isExplicitFailure) {
                const errorMsg = `Prowlarr health state: ${idx.status}`;
                recordIndexerFailure(idx.name, errorMsg);
                this.logger.warn({ indexerName: idx.name, status: idx.status }, "Tracker reported explicit health issue in Prowlarr API");
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error({ error: err.message }, "Failed to fetch indexers from Prowlarr");
    }

    // 2. Filter indexers with soft/graceful tracker health logic
    const trackerHealth = new TrackerHealthManager(this.logger);
    const healthyIds = trackerHealth.getHealthyIndexerIds(indexersList);

    // Build list of active healthy indexer IDs to query in parallel
    const activeIds = healthyIds
      ? healthyIds.split(",").map(id => id.trim())
      : indexersList.filter(idx => idx.enable && idx.protocol === "torrent").map(idx => String(idx.id));

    this.logger.info({
      query,
      activeIds,
      flaresolverrEnabled: config.FLARESOLVERR_ENABLED
    }, "Initiating parallel Prowlarr API search across indexers");

    const startTime = Date.now();

    // Query each indexer in parallel with an individual 6-second timeout
    const searchPromises = activeIds.map(async (id) => {
      const params = new URLSearchParams({
        query,
        type: "search",
        indexerIds: id
      });
      for (const cat of categories) {
        params.append("categories", cat.toString());
      }

      const searchUrl = `${baseUrl}/api/v1/search?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout per tracker

      const trackerStartTime = Date.now();
      const matchedIndexer = indexersList.find(idx => String(idx.id) === id);
      const trackerName = matchedIndexer ? matchedIndexer.name : `Indexer #${id}`;

      try {
        const response = await fetch(searchUrl, {
          method: "GET",
          headers: {
            "X-Api-Key": this.apiKey,
            "Accept": "application/json"
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const trackerLatency = Date.now() - trackerStartTime;

        if (response.status === 401 || response.status === 403) {
          this.logger.error({ indexer: trackerName, status: response.status }, "Prowlarr API access unauthorized. Check PROWLARR_API_KEY.");
          return [];
        }

        if (!response.ok) {
          recordIndexerFailure(trackerName, `HTTP Error ${response.status}`);
          this.logger.warn({ indexer: trackerName, status: response.status, latencyMs: trackerLatency }, "Tracker query returned non-OK status");
          return [];
        }

        const results = await response.json();
        if (!Array.isArray(results)) {
          recordIndexerFailure(trackerName, "Invalid JSON response (expected array)");
          return [];
        }

        // Record successful query stats in SQLite database
        recordIndexerSuccess(trackerName, trackerLatency);
        this.logger.info({ indexer: trackerName, count: results.length, latencyMs: trackerLatency }, "Tracker query completed successfully");
        return results;
      } catch (err: any) {
        clearTimeout(timeoutId);
        const trackerLatency = Date.now() - trackerStartTime;

        if (err.name === "AbortError") {
          recordIndexerFailure(trackerName, "Query Timeout (6000ms exceeded)");
          this.logger.warn({ indexer: trackerName, latencyMs: trackerLatency }, "Tracker query timed out");
        } else {
          recordIndexerFailure(trackerName, err.message || "Network Error");
          this.logger.error({ indexer: trackerName, error: err.message, latencyMs: trackerLatency }, "Tracker query encountered an error");
        }
        return [];
      }
    });

    try {
      // Execute all searches concurrently
      const resultsArrays = await Promise.all(searchPromises);
      const combinedResults = resultsArrays.flat();
      const overallLatency = Date.now() - startTime;

      this.logger.info({
        overallLatencyMs: overallLatency,
        combinedResultsCount: combinedResults.length
      }, "Parallel Prowlarr searches fully resolved");

      // Format results cleanly
      return combinedResults.map(item => ({
        title: item.title || "Unknown Release",
        size: typeof item.size === "number" ? item.size : 0,
        seeders: typeof item.seeders === "number" ? item.seeders : 0,
        peers: typeof item.peers === "number" ? item.peers : 0,
        magnetUrl: item.magnetUrl || undefined,
        downloadUrl: item.downloadUrl || undefined,
        indexer: item.indexer || "Unknown indexer",
        infoHash: item.infoHash || undefined
      }));
    } catch (err: any) {
      this.logger.error({ error: err.message }, "Critical failure waiting for parallel searches");
      return [];
    }
  }
}
