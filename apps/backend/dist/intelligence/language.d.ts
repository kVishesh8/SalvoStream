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
}
/**
 * Deterministically detects language/audio configuration from a release title.
 * Provides high, medium, and weak confidence classifications using expanded dictionaries.
 */
export declare function detectLanguage(title: string): LanguageDetectionResult;
//# sourceMappingURL=language.d.ts.map