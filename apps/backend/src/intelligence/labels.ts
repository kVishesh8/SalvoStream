import { ParsedRelease } from "./parser.js";
import { LanguageDetectionResult } from "./language.js";
import { formatBytes } from "@salvostream/shared-utils";

/**
 * Builds the compact, premium "name" badge shown on the left/top of Stremio's stream list.
 * Restrained format suitable for TV and mobile viewports.
 */
export function formatStreamName(parsed: ParsedRelease): string {
  const parts: string[] = [];

  // Resolution is the primary indicator
  if (parsed.resolution !== "unknown") {
    parts.push(parsed.resolution);
  } else {
    parts.push("RAW");
  }

  // Soft premium badges
  if (parsed.dolbyVision) {
    parts.push("DV");
  } else if (parsed.hdr) {
    parts.push("HDR");
  } else if (parsed.codec === "HEVC") {
    parts.push("HEVC");
  } else if (parsed.codec === "AV1") {
    parts.push("AV1");
  }

  return `SalvoStream\n[${parts.join(" • ")}]`;
}

/**
 * Formats the rich, structured stream description (title) for Stremio.
 * Keeps labels compact, clean, and professional (not emoji-heavy).
 * Preserves the original raw title for full debuggability and transparency.
 */
export function formatStreamTitle(
  rawTitle: string,
  parsed: ParsedRelease,
  lang: LanguageDetectionResult,
  size: number,
  seeders: number,
  peers: number,
  indexer: string
): string {
  const badges: string[] = [];

  // 1. Language marker (restrained emoji usage)
  switch (lang.detectedLanguage) {
    case "Hindi":
      badges.push("🇮🇳 Hindi");
      break;
    case "Hindi Dubbed":
      badges.push("🇮🇳 Hin-Dubbed");
      break;
    case "Dual Audio":
      badges.push("🇮🇳 Hindi Dual");
      break;
    case "Multi Audio":
      badges.push("🔊 Multi Audio");
      break;
    case "English":
    default:
      badges.push("🇬🇧 English");
      break;
  }

  // 2. Resolution & Source Type
  if (parsed.resolution !== "unknown") {
    badges.push(parsed.resolution);
  }
  if (parsed.sourceType !== "unknown") {
    badges.push(parsed.sourceType);
  }

  // 3. Format/Codec indicators
  if (parsed.dolbyVision) {
    badges.push("DV");
  }
  if (parsed.hdr) {
    badges.push("HDR");
  }
  if (parsed.codec !== "unknown") {
    badges.push(parsed.codec);
  }

  // 4. File Size (formatted cleanly)
  if (size > 0) {
    badges.push(formatBytes(size));
  }

  // 5. Release Group (graceful fallback)
  if (parsed.releaseGroup !== "unknown") {
    badges.push(parsed.releaseGroup);
  }

  // Assemble primary clean label
  const cleanLabelLine = badges.join(" • ");

  // Build the multi-line UI description
  // Line 1: Structured details
  // Line 2: Original release title (preserved for debugging/tuning)
  // Line 3: Seeders, peers, and source indexer
  return `${cleanLabelLine}\nOriginal: ${rawTitle}\n👥 ${seeders} seeds • ${peers} peers • ${indexer}`;
}
export { formatBytes };
