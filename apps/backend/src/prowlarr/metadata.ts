export interface MediaMetadata {
  title: string;
  year?: string;
}

// In-memory cache for Cinemeta lookups (TTL: 30 minutes)
interface CacheEntry {
  metadata: MediaMetadata;
  expiry: number;
}

const metadataCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Parses a Stremio request ID (IMDb ID) into structured parameters.
 * E.g., "tt0137523" -> { imdbId: "tt0137523" }
 * E.g., "tt0944947:1:1" -> { imdbId: "tt0944947", season: 1, episode: 1 }
 */
export interface ParsedId {
  imdbId: string;
  season?: number;
  episode?: number;
}

export function parseStremioId(cleanId: string, type: string): ParsedId {
  if (type === "series" && cleanId.includes(":")) {
    const parts = cleanId.split(":");
    return {
      imdbId: parts[0],
      season: parts[1] ? parseInt(parts[1], 10) : undefined,
      episode: parts[2] ? parseInt(parts[2], 10) : undefined
    };
  }
  return { imdbId: cleanId };
}

/**
 * Fetches media metadata from Stremio's Cinemeta API, with in-memory caching.
 */
export async function fetchMetadata(
  type: "movie" | "series",
  imdbId: string,
  logger: { info: (msg: any, details?: string) => void; warn: (msg: any, details?: string) => void }
): Promise<MediaMetadata | null> {
  const cacheKey = `${type}:${imdbId}`;
  const now = Date.now();

  // 1. Check in-memory cache
  const cached = metadataCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    logger.info({ cacheKey, hit: true }, "Metadata cache hit");
    return cached.metadata;
  }

  // 2. Fetch from Cinemeta with timeout
  const url = `https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`;
  logger.info({ imdbId, type, url }, "Fetching metadata from Cinemeta API");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // Strict 4-second timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json"
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn({ status: res.status, imdbId }, "Cinemeta request failed with non-OK status");
      return null;
    }

    const body = await res.json() as any;
    const meta = body?.meta;

    if (!meta || !meta.name) {
      logger.warn({ imdbId }, "Cinemeta returned empty or invalid metadata");
      return null;
    }

    const metadata: MediaMetadata = {
      title: meta.name,
      year: meta.year || undefined
    };

    // Store in-memory cache
    metadataCache.set(cacheKey, {
      metadata,
      expiry: now + CACHE_TTL_MS
    });

    logger.info({ cacheKey, title: metadata.title }, "Metadata resolved and cached");
    return metadata;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      logger.warn({ imdbId, timeoutMs: 4000 }, "Cinemeta request timed out");
    } else {
      logger.warn({ imdbId, error: err.message }, "Cinemeta lookup encountered an error");
    }
    return null;
  }
}

/**
 * Builds a search query formatted for torrent search.
 * Movies: "Title Year" or "Title"
 * Series: "Title S01E01"
 */
export function buildSearchQuery(parsed: ParsedId, meta: MediaMetadata | null): string {
  if (!meta) {
    // Graceful fallback to IMDb ID if no metadata is available
    return parsed.imdbId;
  }

  if (parsed.season !== undefined && parsed.episode !== undefined) {
    const sStr = String(parsed.season).padStart(2, "0");
    const eStr = String(parsed.episode).padStart(2, "0");
    return `${meta.title} S${sStr}E${eStr}`;
  }

  return meta.year ? `${meta.title} ${meta.year}` : meta.title;
}
