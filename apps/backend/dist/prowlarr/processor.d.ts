import { ProwlarrSearchResult } from "./client.js";
import { StremioStream } from "@salvostream/shared-types";
/**
 * Validates and extracts a clean 40-character hex infoHash from Prowlarr properties.
 * Support standard magnet link formats or direct infoHash.
 */
export declare function parseAndValidateInfoHash(magnetUrl?: string, directHash?: string): string | null;
/**
 * Checks if a release title contains blacklisted keywords.
 */
export declare function isSpamOrNSFW(title: string): boolean;
/**
 * Extracts video resolution if obvious in the title (e.g. 1080p, 2160p/4k, 720p).
 */
export declare function parseResolution(title: string): string;
/**
 * Processes, filters, sorts, and converts Prowlarr search results into StremioStream objects.
 */
export declare function processAndRenderStreams(results: ProwlarrSearchResult[], logger: {
    info: (msg: any) => void;
}): StremioStream[];
//# sourceMappingURL=processor.d.ts.map