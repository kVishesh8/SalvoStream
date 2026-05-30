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
  ottBonus: number;
  isCam: boolean;
}

/**
 * Calculates a highly deterministic quality and ranking score for a release.
 * Strictly prioritizes Quality Tiers, while allowing language, codec, HDR, and seeders
 * to influence ordering within the same tier. CAM releases are heavily penalized but preserved.
 */
export function calculateScore(
  parsed: ParsedRelease,
  lang: LanguageDetectionResult,
  seeders: number
): ScoringResult {
  // 1. Zero seeder check
  if (seeders <= 0) {
    return {
      score: 0,
      qualityTier: 0,
      baseScore: 0,
      languageBonus: 0,
      sourceBonus: 0,
      codecBonus: 0,
      hdrBonus: 0,
      seederBonus: 0,
      ottBonus: 0,
      isCam: parsed.sourceType === "CAM" || parsed.sourceType === "TeleSync"
    };
  }

  // 2. Identify Quality Tier
  // 5: 2160p (UHD)
  // 4: 1080p (FHD)
  // 3: 720p (HD)
  // 2: 480p/576p/SD
  // 1: unknown / low resolution
  // 0: CAM / TS (strictly penalized to the bottom)
  const isCam = parsed.sourceType === "CAM" || parsed.sourceType === "TeleSync";
  let qualityTier = 1;

  if (isCam) {
    qualityTier = 0;
  } else {
    switch (parsed.resolution) {
      case "2160p":
        qualityTier = 5;
        break;
      case "1080p":
        qualityTier = 4;
        break;
      case "720p":
        qualityTier = 3;
        break;
      case "576p":
      case "480p":
        qualityTier = 2;
        break;
      default:
        qualityTier = 1;
        break;
    }
  }

  // Large tier gap to make quality tier strictly primary
  const baseScore = qualityTier * 100000;

  // 3. Language priority bonus (influences ranking within tiers)
  let languageBonus = 0;
  switch (lang.detectedLanguage) {
    case "Hindi":
      languageBonus = 20000;
      break;
    case "Hindi Dubbed":
      languageBonus = 15000;
      break;
    case "Dual Audio":
      languageBonus = 12000;
      break;
    case "Multi Audio":
      languageBonus = 8000;
      break;
    case "English":
    default:
      languageBonus = 0;
      break;
  }

  // 4. Source type bonus (within same tier, prefer premium releases)
  let sourceBonus = 0;
  switch (parsed.sourceType) {
    case "WEB-DL":
    case "BluRay":
      sourceBonus = 5000;
      break;
    case "WEBRip":
      sourceBonus = 3000;
      break;
    case "HDTV":
      sourceBonus = 1000;
      break;
    case "DVD":
      sourceBonus = 500;
      break;
    case "unknown":
    default:
      sourceBonus = 0;
      break;
  }

  // 5. Codec bonus (lightweight HEVC/AV1 bonuses, never overpowering tiers)
  let codecBonus = 0;
  switch (parsed.codec) {
    case "AV1":
      codecBonus = 2000;
      break;
    case "HEVC":
      codecBonus = 1500;
      break;
    case "AVC":
      codecBonus = 500;
      break;
    case "unknown":
    default:
      codecBonus = 0;
      break;
  }

  // 6. HDR/Dolby Vision bonus
  let hdrBonus = 0;
  if (parsed.dolbyVision) {
    hdrBonus += 3000;
  }
  if (parsed.hdr) {
    hdrBonus += 1500;
  }

  // 7. Seeder influence (penalize low seeds, reward higher seeds up to a cap)
  let seederBonus = 0;
  if (seeders < 3) {
    seederBonus = -5000; // Soft penalty
  } else {
    // Reward seeders as a fine-grained tiebreaker within the same tier (up to 1,000 points)
    seederBonus = Math.min(seeders, 1000);
  }

  // 7b. OTT Release bonus (lightweight tie-breaker)
  let ottBonus = 0;
  if (parsed.ott && parsed.ott.length > 0) {
    ottBonus = 500; // Small tie-breaker that slightly elevates OTT releases within the same tier
  }

  // 8. Calculate total score
  const score = baseScore + languageBonus + sourceBonus + codecBonus + hdrBonus + seederBonus + ottBonus;

  return {
    score,
    qualityTier,
    baseScore,
    languageBonus,
    sourceBonus,
    codecBonus,
    hdrBonus,
    seederBonus,
    ottBonus,
    isCam
  };
}
