"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndValidateInfoHash = parseAndValidateInfoHash;
exports.isSpamOrNSFW = isSpamOrNSFW;
exports.parseResolution = parseResolution;
exports.processAndRenderStreams = processAndRenderStreams;
const shared_utils_1 = require("@salvostream/shared-utils");
// Lightweight keyword blacklist for obvious spam, fake, and NSFW torrents
const BLACKLIST_KEYWORDS = [
    "xxx", "porn", "adult", "sex", "erotic", "nude",
    "camrip", "cam-rip", "ts-rip", "telesync",
    "virus", "malware", "setup.exe", "download_here", "installer"
];
const MAX_STREAMS_LIMIT = 25;
/**
 * Validates and extracts a clean 40-character hex infoHash from Prowlarr properties.
 * Support standard magnet link formats or direct infoHash.
 */
function parseAndValidateInfoHash(magnetUrl, directHash) {
    // 1. If we have a direct infoHash, validate it is a 40-char hex
    if (directHash) {
        const cleanHash = directHash.trim().toLowerCase();
        if (/^[a-f0-9]{40}$/.test(cleanHash)) {
            return cleanHash;
        }
    }
    // 2. Extract from magnetUrl if directHash is missing or invalid
    if (magnetUrl) {
        // Regex matches the standard BitTorrent Info Hash (btih) in magnet URIs
        const match = magnetUrl.match(/xt=urn:btih:([a-f0-9]{40}|[a-z2-7]{32})/i);
        if (match) {
            const hash = match[1].toLowerCase();
            // If it is base32 (32 characters), it's a valid info hash format, though hex is preferred.
            if (hash.length === 40 || hash.length === 32) {
                return hash;
            }
        }
    }
    return null;
}
/**
 * Checks if a release title contains blacklisted keywords.
 */
function isSpamOrNSFW(title) {
    const cleanTitle = title.toLowerCase();
    return BLACKLIST_KEYWORDS.some(keyword => cleanTitle.includes(keyword));
}
/**
 * Extracts video resolution if obvious in the title (e.g. 1080p, 2160p/4k, 720p).
 */
function parseResolution(title) {
    const match = title.match(/(2160p|4k|1080p|720p|480p)/i);
    if (match) {
        const res = match[1].toLowerCase();
        return res === "4k" ? "2160p" : res;
    }
    return "";
}
/**
 * Processes, filters, sorts, and converts Prowlarr search results into StremioStream objects.
 */
function processAndRenderStreams(results, logger) {
    const processedStreams = [];
    // Tracking structures for deduplication
    const seenHashes = new Set();
    const seenTitleSizes = new Set();
    // 1. Sort by seeders descending before filtering and slicing to keep the best streams
    const sortedResults = [...results].sort((a, b) => b.seeders - a.seeders);
    for (const item of sortedResults) {
        // A. Filter torrents with 0 seeders
        if (item.seeders <= 0) {
            continue;
        }
        // B. Validate and extract infoHash
        const infoHash = parseAndValidateInfoHash(item.magnetUrl, item.infoHash);
        if (!infoHash) {
            continue; // Skip if no valid infoHash/magnet link is found
        }
        // C. Spam and NSFW Keyword blacklist filter
        if (isSpamOrNSFW(item.title)) {
            continue;
        }
        // D. Deduplication checks
        // D1. Deduplicate by exact infoHash
        if (seenHashes.has(infoHash)) {
            continue;
        }
        // D2. Deduplicate by title & size (removes identical cross-uploads)
        const titleSizeKey = `${item.title.toLowerCase().trim()}_${item.size}`;
        if (seenTitleSizes.has(titleSizeKey)) {
            continue;
        }
        // Mark as seen
        seenHashes.add(infoHash);
        seenTitleSizes.add(titleSizeKey);
        // E. Map to Stremio Stream
        const resolution = parseResolution(item.title);
        const formattedSize = (0, shared_utils_1.formatBytes)(item.size);
        // UI stream list badge: e.g. "SalvoStream\n1080p"
        const name = `SalvoStream\n${resolution || "RAW"}`;
        // UI details text formatting
        // Resolution • Size • Seeders • Indexer
        const metaParts = [];
        if (resolution)
            metaParts.push(resolution);
        if (item.size > 0)
            metaParts.push(formattedSize);
        metaParts.push(`${item.seeders} seeders`);
        metaParts.push(item.indexer);
        const badgeLine = metaParts.join(" • ");
        const title = `${item.title}\n${badgeLine}`;
        processedStreams.push({
            name,
            title,
            infoHash,
            fileIdx: 0 // Play the first/largest video file natively
        });
        // F. Stop if we've reached the search result limit
        if (processedStreams.length >= MAX_STREAMS_LIMIT) {
            break;
        }
    }
    logger.info({
        totalRawResults: results.length,
        finalRenderedStreams: processedStreams.length
    });
    return processedStreams;
}
//# sourceMappingURL=processor.js.map