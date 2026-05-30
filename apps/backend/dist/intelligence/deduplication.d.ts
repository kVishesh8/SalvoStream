import { ParsedRelease } from "./parser.js";
import { ScoringResult } from "./scoring.js";
export interface DeduplicationCandidate {
    originalIndex: number;
    parsed: ParsedRelease;
    scoreResult: ScoringResult;
    size: number;
    infoHash: string;
}
/**
 * Normalizes a media title to provide a clean, noise-free string for comparison.
 * Uses already parsed season/episode/anime information for absolute precision.
 */
export declare function normalizeMediaTitle(rawTitle: string, parsed: ParsedRelease): string;
export interface EnhancedCandidate {
    rawTitle: string;
    parsed: ParsedRelease;
    scoreResult: ScoringResult;
    size: number;
    infoHash: string;
}
/**
 * Collapses duplicate torrent search results based on:
 * - Normalized title
 * - Quality tier
 * - Codec
 * - HDR and Dolby Vision flags
 * - Size similarity (within 10% tolerance)
 * Retains the single best-scoring duplicate variant.
 */
export declare function collapseDuplicates(candidates: EnhancedCandidate[], logger: {
    info: (msg: any) => void;
}): EnhancedCandidate[];
//# sourceMappingURL=deduplication.d.ts.map