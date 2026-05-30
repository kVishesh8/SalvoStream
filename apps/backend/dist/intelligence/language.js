"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = detectLanguage;
/**
 * Deterministically detects language/audio configuration from a release title.
 * Provides high, medium, and weak confidence classifications.
 */
function detectLanguage(title) {
    const cleanTitle = title.trim();
    const lowerTitle = cleanTitle.toLowerCase();
    let detectedLanguage = "English";
    let confidence = "weak"; // English fallback default
    let isHindi = false;
    let isHindiDubbed = false;
    let isDualAudio = false;
    let isMultiAudio = false;
    // 1. Explicit Hindi Dubbed check
    const isDubbedRegex = /\b(hindi[-._]?dubbed|hin[-._]?dubbed|hindi[-._]?dub|hin[-._]?dub|dubbed[-._]?hindi)\b/i;
    if (isDubbedRegex.test(lowerTitle)) {
        detectedLanguage = "Hindi Dubbed";
        confidence = "high";
        isHindiDubbed = true;
    }
    // 2. Dual Audio with explicit Hindi and English
    else if (/\b(dual[-._]?audio|dual[-._]?aud|dual)\b/i.test(lowerTitle) &&
        /\b(hindi|hin|india|ind)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "high";
        isDualAudio = true;
    }
    // 3. General Dual Audio or explicit Eng-Hin / Hin-Eng patterns
    else if (/\b(eng[-._]?hin|hin[-._]?eng|hindi[-._]?english|english[-._]?hindi)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "high";
        isDualAudio = true;
    }
    // 4. Native/General Hindi Check
    else if (/\b(hindi|hin)\b/i.test(lowerTitle)) {
        detectedLanguage = "Hindi";
        // If it also contains "dub", mark as Hindi Dubbed (medium confidence)
        if (/\b(dub|dubbed)\b/i.test(lowerTitle)) {
            detectedLanguage = "Hindi Dubbed";
            confidence = "medium";
            isHindiDubbed = true;
        }
        else {
            confidence = "high";
            isHindi = true;
        }
    }
    // 5. General Dual Audio (no explicit Hindi keyword, could be Eng-Spa, etc.)
    else if (/\b(dual[-._]?audio|dual[-._]?aud|dual)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "medium";
        isDualAudio = true;
    }
    // 6. Multi Audio patterns
    else if (/\b(multi[-._]?audio|multi[-._]?aud|multi[-._]?lang|multi)\b/i.test(lowerTitle)) {
        detectedLanguage = "Multi Audio";
        confidence = /\b(multi[-._]?audio|multi[-._]?lang)\b/i.test(lowerTitle) ? "high" : "medium";
        isMultiAudio = true;
    }
    // 7. Explicit English
    else if (/\b(english|eng)\b/i.test(lowerTitle)) {
        detectedLanguage = "English";
        confidence = "high";
    }
    // Backwards compatibility / ease of use flags
    const finalIsHindi = isHindi || detectedLanguage === "Hindi";
    const finalIsHindiDubbed = isHindiDubbed || detectedLanguage === "Hindi Dubbed";
    const finalIsDualAudio = isDualAudio || detectedLanguage === "Dual Audio";
    const finalIsMultiAudio = isMultiAudio || detectedLanguage === "Multi Audio";
    return {
        detectedLanguage,
        confidence,
        isHindi: finalIsHindi,
        isHindiDubbed: finalIsHindiDubbed,
        isDualAudio: finalIsDualAudio,
        isMultiAudio: finalIsMultiAudio
    };
}
//# sourceMappingURL=language.js.map