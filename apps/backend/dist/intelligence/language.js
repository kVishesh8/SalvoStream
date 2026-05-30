"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = detectLanguage;
/**
 * Deterministically detects language/audio configuration from a release title.
 * Provides high, medium, and weak confidence classifications using expanded dictionaries.
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
    let isOrg = false;
    let isHq = false;
    // 1. Explicit Org Hindi & Hq Hindi Patterns (High Confidence)
    const isOrgRegex = /\b(org[-._]?hindi|hindi[-._]?org|org[-._]?hin|hin[-._]?org|original[-._]?hindi|hindi[-._]?original)\b/i;
    const isHqRegex = /\b(hq[-._]?hindi|hindi[-._]?hq|hq[-._]?hin|hin[-._]?hq|hq[-._]?dub|dub[-._]?hq)\b/i;
    if (isOrgRegex.test(lowerTitle)) {
        detectedLanguage = "Hindi";
        confidence = "high";
        isHindi = true;
        isOrg = true;
    }
    else if (isHqRegex.test(lowerTitle)) {
        detectedLanguage = "Hindi";
        confidence = "high";
        isHindi = true;
        isHq = true;
    }
    // 2. Explicit Hindi Dubbed check (High Confidence)
    else if (/\b(hindi[-._]?dubbed|hin[-._]?dubbed|hindi[-._]?dub|hin[-._]?dub|dubbed[-._]?hindi|dub[-._]?hindi|hindi[-._]?dubbing|hin[-._]?dubbing)\b/i.test(lowerTitle)) {
        detectedLanguage = "Hindi Dubbed";
        confidence = "high";
        isHindiDubbed = true;
    }
    // 3. Dual Audio with explicit Hindi and English (High Confidence)
    else if (/\b(dual[-._]?audio|dual[-._]?aud|dual|2[-._]?audio|2[-._]?aud)\b/i.test(lowerTitle) &&
        /\b(hindi|hin|india|ind)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "high";
        isDualAudio = true;
    }
    // 4. Specific Eng-Hin / Hin-Eng language pair patterns (High Confidence)
    else if (/\b(eng[-._]?hin|hin[-._]?eng|hindi[-._]?english|english[-._]?hindi|hindi[-._]?eng|eng[-._]?hindi)\b/i.test(lowerTitle) ||
        /\b(h[-._]e|e[-._]h)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "high";
        isDualAudio = true;
    }
    // 5. Native/General Hindi Check
    else if (/\b(hindi|hin)\b/i.test(lowerTitle)) {
        // If it also contains "dub", mark as Hindi Dubbed (medium confidence)
        if (/\b(dub|dubbed|dubbing)\b/i.test(lowerTitle)) {
            detectedLanguage = "Hindi Dubbed";
            confidence = "medium";
            isHindiDubbed = true;
        }
        else {
            detectedLanguage = "Hindi";
            confidence = "high";
            isHindi = true;
        }
    }
    // 6. General Dual Audio (no explicit Hindi keyword, could be Eng-Spa, etc.)
    else if (/\b(dual[-._]?audio|dual[-._]?aud|dual|2[-._]?audio|2[-._]?aud)\b/i.test(lowerTitle)) {
        detectedLanguage = "Dual Audio";
        confidence = "medium";
        isDualAudio = true;
    }
    // 7. Multi Audio patterns
    else if (/\b(multi[-._]?audio|multi[-._]?aud|multi[-._]?lang|multi)\b/i.test(lowerTitle)) {
        detectedLanguage = "Multi Audio";
        confidence = /\b(multi[-._]?audio|multi[-._]?lang)\b/i.test(lowerTitle) ? "high" : "medium";
        isMultiAudio = true;
    }
    // 8. Explicit English (High Confidence)
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
        isMultiAudio: finalIsMultiAudio,
        isOrg,
        isHq
    };
}
//# sourceMappingURL=language.js.map