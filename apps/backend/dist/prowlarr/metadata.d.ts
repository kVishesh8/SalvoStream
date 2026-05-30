export interface MediaMetadata {
    title: string;
    year?: string;
}
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
export declare function parseStremioId(cleanId: string, type: string): ParsedId;
/**
 * Fetches media metadata from Stremio's Cinemeta API, with in-memory caching.
 */
export declare function fetchMetadata(type: "movie" | "series", imdbId: string, logger: {
    info: (msg: any, details?: string) => void;
    warn: (msg: any, details?: string) => void;
}): Promise<MediaMetadata | null>;
/**
 * Builds a search query formatted for torrent search.
 * Movies: "Title Year" or "Title"
 * Series: "Title S01E01"
 */
export declare function buildSearchQuery(parsed: ParsedId, meta: MediaMetadata | null): string;
//# sourceMappingURL=metadata.d.ts.map