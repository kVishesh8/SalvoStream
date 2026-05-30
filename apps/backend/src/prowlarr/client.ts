import { config } from "../config/env.js";

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
  private logger: { info: (msg: any, details?: string) => void; error: (msg: any, details?: string) => void; warn: (msg: any, details?: string) => void };

  constructor(logger: any) {
    this.url = config.PROWLARR_URL;
    this.apiKey = config.PROWLARR_API_KEY;
    this.logger = logger;
  }

  /**
   * Queries Prowlarr for search results using the generated query.
   */
  async search(query: string, type: "movie" | "series"): Promise<ProwlarrSearchResult[]> {
    if (!this.apiKey) {
      this.logger.warn("Prowlarr search called but PROWLARR_API_KEY is not configured.");
      return [];
    }

    // Prepare Prowlarr URL
    const baseUrl = this.url.endsWith("/") ? this.url.slice(0, -1) : this.url;
    
    // Choose categories based on media type
    // 2000 Series: Movies
    // 5000 Series: TV/Series
    const categories = type === "movie" ? [2000] : [5000];

    const params = new URLSearchParams({
      query,
      type: "search",
    });

    for (const cat of categories) {
      params.append("categories", cat.toString());
    }

    const searchUrl = `${baseUrl}/api/v1/search?${params.toString()}`;
    
    // Hiding API key in URL logging
    this.logger.info({ query, type, url: searchUrl }, "Initiating Prowlarr API search");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Strict 8-second timeout

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

      if (response.status === 401 || response.status === 403) {
        this.logger.error({ status: response.status }, "Prowlarr API access unauthorized. Check PROWLARR_API_KEY.");
        return [];
      }

      if (!response.ok) {
        this.logger.error({ status: response.status }, "Prowlarr search API returned non-OK status");
        return [];
      }

      const results = await response.json();
      if (!Array.isArray(results)) {
        this.logger.error("Prowlarr search API returned invalid response (expected array)");
        return [];
      }

      this.logger.info({ count: results.length }, "Prowlarr search query completed successfully");

      return results.map(item => ({
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
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        this.logger.error({ query, timeoutMs: 8000 }, "Prowlarr search API request timed out");
      } else {
        this.logger.error({ query, error: err.message }, "Prowlarr search API encountered an error");
      }
      return [];
    }
  }
}
