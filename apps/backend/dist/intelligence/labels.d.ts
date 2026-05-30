import { ParsedRelease } from "./parser.js";
import { LanguageDetectionResult } from "./language.js";
import { formatBytes } from "@salvostream/shared-utils";
/**
 * Builds the compact, premium "name" badge shown on the left/top of Stremio's stream list.
 * Restrained format suitable for TV and mobile viewports.
 */
export declare function formatStreamName(parsed: ParsedRelease): string;
/**
 * Formats the rich, structured stream description (title) for Stremio.
 * Keeps labels compact, clean, and professional.
 * Preserves the original raw title for full debuggability and transparency as a 5th line.
 */
export declare function formatStreamTitle(rawTitle: string, parsed: ParsedRelease, lang: LanguageDetectionResult, size: number, seeders: number, peers: number, indexer: string): string;
export { formatBytes };
//# sourceMappingURL=labels.d.ts.map