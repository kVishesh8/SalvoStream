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
  // High fidelity visual presentation metadata
  languages?: string[];
  flags?: string[];
}

const CONFIDENT_LANGUAGES = [
  { name: "Hindi", flag: "🇮🇳", regex: /\b(hindi|hin)\b/i },
  { name: "Tamil", flag: "🇮🇳", regex: /\b(tamil|tam)\b/i },
  { name: "Telugu", flag: "🇮🇳", regex: /\b(telugu|tel)\b/i },
  { name: "Kannada", flag: "🇮🇳", regex: /\b(kannada|kan)\b/i },
  { name: "Malayalam", flag: "🇮🇳", regex: /\b(malayalam|mal)\b/i },
  { name: "Bengali", flag: "🇮🇳", regex: /\b(bengali|ben)\b/i },
  { name: "Marathi", flag: "🇮🇳", regex: /\b(marathi|mar)\b/i },
  { name: "Punjabi", flag: "🇮🇳", regex: /\b(punjabi|pan|pja)\b/i },
  { name: "Gujarati", flag: "🇮🇳", regex: /\b(gujarati|guj)\b/i },
  { name: "English", flag: "🇬🇧", regex: /\b(english|eng)\b/i },
  { name: "French", flag: "🇫🇷", regex: /\b(french|fre|fra)\b/i },
  { name: "Spanish", flag: "🇪🇸", regex: /\b(spanish|spa|esp)\b/i },
  { name: "German", flag: "🇩🇪", regex: /\b(german|ger|deu)\b/i },
  { name: "Italian", flag: "🇮🇹", regex: /\b(italian|ita)\b/i },
  { name: "Portuguese", flag: "🇵🇹", regex: /\b(portuguese|por)\b/i },
  { name: "Russian", flag: "🇷🇺", regex: /\b(russian|rus)\b/i },
  { name: "Chinese", flag: "🇨🇳", regex: /\b(chinese|chi|zho)\b/i },
  { name: "Japanese", flag: "🇯🇵", regex: /\b(japanese|jpn)\b/i },
  { name: "Korean", flag: "🇰🇷", regex: /\b(korean|kor)\b/i }
];

/**
 * Deterministically detects language/audio configuration from a release title.
 * Provides high, medium, and weak confidence classifications using expanded dictionaries.
 * Additionally extracts high-confidence visual language flags and list for presentation.
 */
export function detectLanguage(title: string): LanguageDetectionResult {
  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();

  let detectedLanguage: LanguageType = "English";
  let confidence: ConfidenceType = "weak"; // English fallback default

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
  } else if (isHqRegex.test(lowerTitle)) {
    detectedLanguage = "Hindi";
    confidence = "high";
    isHindi = true;
    isHq = true;
  }
  // 2. Explicit Hindi Dubbed check (High Confidence)
  else if (
    /\b(hindi[-._]?dubbed|hin[-._]?dubbed|hindi[-._]?dub|hin[-._]?dub|dubbed[-._]?hindi|dub[-._]?hindi|hindi[-._]?dubbing|hin[-._]?dubbing)\b/i.test(lowerTitle)
  ) {
    detectedLanguage = "Hindi Dubbed";
    confidence = "high";
    isHindiDubbed = true;
  }
  // 3. Dual Audio with explicit Hindi and English (High Confidence)
  else if (
    /\b(dual[-._]?audio|dual[-._]?aud|dual|2[-._]?audio|2[-._]?aud)\b/i.test(lowerTitle) &&
    /\b(hindi|hin|india|ind)\b/i.test(lowerTitle)
  ) {
    detectedLanguage = "Dual Audio";
    confidence = "high";
    isDualAudio = true;
  }
  // 4. Specific Eng-Hin / Hin-Eng language pair patterns (High Confidence)
  else if (
    /\b(eng[-._]?hin|hin[-._]?eng|hindi[-._]?english|english[-._]?hindi|hindi[-._]?eng|eng[-._]?hindi)\b/i.test(lowerTitle) ||
    /\b(h[-._]e|e[-._]h)\b/i.test(lowerTitle)
  ) {
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
    } else {
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

  // --- High-fidelity Language & Flag Extraction for Presentation ---
  const detectedLangsList: string[] = [];
  const flagsList: string[] = [];

  // Match all languages confidently present in the title
  for (const lang of CONFIDENT_LANGUAGES) {
    if (lang.regex.test(lowerTitle)) {
      detectedLangsList.push(lang.name);
      if (!flagsList.includes(lang.flag)) {
        flagsList.push(lang.flag);
      }
    }
  }

  // Heuristic: If dual and we confidently found a regional/Hindi language,
  // but English is not explicitly in the title, it is practically always a Dual Audio with English.
  if (finalIsDualAudio && detectedLangsList.length > 0) {
    const hasIndianLang = detectedLangsList.some(l =>
      ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Punjabi", "Gujarati"].includes(l)
    );
    if (hasIndianLang && !detectedLangsList.includes("English")) {
      detectedLangsList.push("English");
      if (!flagsList.includes("🇬🇧")) {
        flagsList.push("🇬🇧");
      }
    }
  }

  // Deduplicate and order flags: 🇮🇳 (Hindi/Regional) first, then 🇬🇧 (English), then others
  const finalFlags: string[] = [];
  if (flagsList.includes("🇮🇳")) finalFlags.push("🇮🇳");
  if (flagsList.includes("🇬🇧")) finalFlags.push("🇬🇧");
  for (const flag of flagsList) {
    if (flag !== "🇮🇳" && flag !== "🇬🇧") {
      finalFlags.push(flag);
    }
  }

  // Fallback default flags for Dual/Multi Audio when no languages matched confidently
  if ((finalIsDualAudio || finalIsMultiAudio) && finalFlags.length === 0) {
    // We default to glob/network flag when no language was explicitly detected
    finalFlags.push("🌐");
  } else if (detectedLanguage === "English" && finalFlags.length === 0) {
    finalFlags.push("🇬🇧");
  } else if (finalIsHindi && finalFlags.length === 0) {
    finalFlags.push("🇮🇳");
  }

  return {
    detectedLanguage,
    confidence,
    isHindi: finalIsHindi,
    isHindiDubbed: finalIsHindiDubbed,
    isDualAudio: finalIsDualAudio,
    isMultiAudio: finalIsMultiAudio,
    isOrg,
    isHq,
    languages: detectedLangsList.length > 0 ? detectedLangsList : [detectedLanguage],
    flags: finalFlags
  };
}
