import { ParsedRelease } from "./parser.js";
import { LanguageDetectionResult } from "./language.js";
export interface ScoringResult {
    score: number;
    qualityTier: number;
    baseScore: number;
    languageBonus: number;
    sourceBonus: number;
    codecBonus: number;
    hdrBonus: number;
    seederBonus: number;
    isCam: boolean;
}
/**
 * Calculates a highly deterministic quality and ranking score for a release.
 * Strictly prioritizes Quality Tiers, while allowing language, codec, HDR, and seeders
 * to influence ordering within the same tier. CAM releases are heavily penalized but preserved.
 */
export declare function calculateScore(parsed: ParsedRelease, lang: LanguageDetectionResult, seeders: number): ScoringResult;
//# sourceMappingURL=scoring.d.ts.map