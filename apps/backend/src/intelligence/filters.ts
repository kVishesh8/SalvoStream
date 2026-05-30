import { parseAndValidateInfoHash } from "../prowlarr/processor.js";

// Comprehensive blacklist for junk, spam, NSFW, and fake releases
const BLACKLIST_KEYWORDS = [
  "xxx", "porn", "adult", "erotic", "nude", "naked", "hentai", "milf", "pussy", "blowjob",
  "virus", "malware", "setup.exe", "install.exe", "installer.exe", "cracked", "keygen",
  "download_here", "sponsored", "advertisement", "scam", "phishing", "adware", "spyware",
  "setup_free", "get_free", "click_here", "premium_download"
];

export interface FilterResult {
  isSpam: boolean;
  reason?: string;
}

/**
 * Deterministically checks if a release is junk, spam, or fake.
 * Ensures high safety without aggressive false positives on valid media titles.
 */
export function filterJunkRelease(
  title: string,
  magnetUrl?: string,
  directHash?: string
): FilterResult {
  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();

  // 1. InfoHash validation (invalid/missing infoHash is junk)
  const infoHash = parseAndValidateInfoHash(magnetUrl, directHash);
  if (!infoHash) {
    return { isSpam: true, reason: "Invalid or missing BitTorrent InfoHash" };
  }

  // 2. Keyword blacklist check
  for (const keyword of BLACKLIST_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      return { isSpam: true, reason: `Matches blacklisted junk keyword: '${keyword}'` };
    }
  }

  // 3. File extension junk check inside release name
  // Standard video files are not .exe, .zip, .rar, .apk, .dmg, etc.
  const invalidExtensions = /\.(exe|zip|rar|apk|dmg|iso|tar|gz|7z|msi|bat|sh)$/i;
  if (invalidExtensions.test(lowerTitle)) {
    return { isSpam: true, reason: "Contains suspicious non-media file extension" };
  }

  // 4. Fake release markers (e.g. extremely long strings of random numbers, typical of indexer spam)
  if (/^[a-f0-9]{32,40}$/i.test(cleanTitle)) {
    return { isSpam: true, reason: "Release title is a raw hash, likely spam" };
  }

  return { isSpam: false };
}
export { parseAndValidateInfoHash };
