export type LanguageType = "Hindi" | "Hindi Dubbed" | "Dual Audio" | "Multi Audio" | "English";
export type ConfidenceType = "high" | "medium" | "weak" | "unknown";
export interface LanguageDetectionResult {
    detectedLanguage: LanguageType;
    confidence: ConfidenceType;
    isHindi: boolean;
    isHindiDubbed: boolean;
    isDualAudio: boolean;
    isMultiAudio: boolean;
    isOrg?: boolean;
    isHq?: boolean;
    languages?: string[];
    flags?: string[];
}
/**
 * Deterministically detects language/audio configuration from a release title.
 * Provides high, medium, and weak confidence classifications using expanded dictionaries.
 * Additionally extracts high-confidence visual language flags and list for presentation.
 */
export declare function detectLanguage(title: string): LanguageDetectionResult;
//# sourceMappingURL=language.d.ts.map