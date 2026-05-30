"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMediaTitle = normalizeMediaTitle;
exports.collapseDuplicates = collapseDuplicates;
/**
 * Normalizes a media title to provide a clean, noise-free string for comparison.
 * Uses already parsed season/episode/anime information for absolute precision.
 */
function normalizeMediaTitle(rawTitle, parsed) {
    let clean = rawTitle;
    // 1. Strip parsed release group and fansub groups from the title to ensure different uploads of the same torrent collapse
    if (parsed.releaseGroup && parsed.releaseGroup !== "unknown") {
        // Escape special characters in the group name for regex safety
        const escapedGroup = parsed.releaseGroup.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const groupRegex = new RegExp(`[-._]?\\b${escapedGroup}\\b`, "i");
        clean = clean.replace(groupRegex, "");
    }
    if (parsed.isAnime && parsed.animeFansubGroup && parsed.animeFansubGroup !== "unknown") {
        const escapedFansub = parsed.animeFansubGroup.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const fansubRegex = new RegExp(`\\[${escapedFansub}\\]`, "i");
        clean = clean.replace(fansubRegex, "");
    }
    clean = clean.toLowerCase();
    // Remove common media container extensions
    clean = clean.replace(/\.(mp4|mkv|avi|mov|flv|wmv|mpg|mpeg)$/i, "");
    // Strip brackets, parentheses, and typical release group patterns
    clean = clean.replace(/[\[\]\(\)\{\}]/g, " ");
    // Strip common noisy release words to isolate core title
    const noisePatterns = [
        /\b(2160p|1080p|720p|480p|576p|360p|4k|uhd|fhd|hd|sd)\b/g,
        /\b(web[-._]?dl|webrip|bluray|bdrip|brrip|hdtv|camrip|cam|hdcam|telesync|ts|dvdrip|dvd)\b/g,
        /\b(x265|h265|hevc|x264|h264|avc|av1|10bit)\b/g,
        /\b(hdr|hdr10|hdr10\+|dv|dovi|dolby[-._]?vision)\b/g,
        /\b(atmos|ddp|dd\+|eac3|dts|aac|ac3|5\.1|7\.1)\b/g,
        /\b(hindi|hin|dubbed|dub|dual[-._]?audio|multi[-._]?audio|eng[-._]?hin|hin[-._]?eng|english|eng)\b/g,
        /\b(repack|proper|extended|unrated|director[-._]?s[-._]?cut|remastered)\b/g
    ];
    for (const pattern of noisePatterns) {
        clean = clean.replace(pattern, " ");
    }
    // Strip non-alphanumeric characters, leaving only letters, numbers, and spaces
    clean = clean.replace(/[^a-z0-9\s]/g, " ");
    // Collapse multiple spaces into one and trim
    const coreTitle = clean.replace(/\s+/g, " ").trim();
    // Append deterministic season/episode identifiers
    if (parsed.isAnime && parsed.animeEpisode !== undefined) {
        return `${coreTitle} ep ${parsed.animeEpisode}`;
    }
    else if (parsed.season !== undefined && parsed.episode !== undefined) {
        const s = String(parsed.season).padStart(2, "0");
        const e = String(parsed.episode).padStart(2, "0");
        return `${coreTitle} s${s}e${e}`;
    }
    else if (parsed.season !== undefined) {
        return `${coreTitle} season ${parsed.season}`;
    }
    return coreTitle;
}
/**
 * Collapses duplicate torrent search results based on:
 * - Normalized title
 * - Quality tier
 * - Codec
 * - HDR and Dolby Vision flags
 * - Size similarity (within 10% tolerance)
 * Retains the single best-scoring duplicate variant.
 */
function collapseDuplicates(candidates, logger) {
    const uniqueStreams = [];
    for (const newCand of candidates) {
        const normNewTitle = normalizeMediaTitle(newCand.rawTitle, newCand.parsed);
        let isDuplicateFound = false;
        for (let i = 0; i < uniqueStreams.length; i++) {
            const existing = uniqueStreams[i];
            const normExistingTitle = normalizeMediaTitle(existing.rawTitle, existing.parsed);
            // Check if they are duplicates of each other
            const titleMatch = normNewTitle === normExistingTitle;
            const qualityMatch = newCand.scoreResult.qualityTier === existing.scoreResult.qualityTier;
            const codecMatch = newCand.parsed.codec === existing.parsed.codec;
            const hdrMatch = newCand.parsed.hdr === existing.parsed.hdr;
            const dvMatch = newCand.parsed.dolbyVision === existing.parsed.dolbyVision;
            // Size similarity (within 10% threshold)
            const sizeDiffRatio = Math.abs(newCand.size - existing.size) / Math.max(newCand.size, existing.size);
            const sizeMatch = newCand.size === 0 || existing.size === 0 || sizeDiffRatio < 0.10;
            if ((newCand.infoHash === existing.infoHash) ||
                (titleMatch && qualityMatch && codecMatch && hdrMatch && dvMatch && sizeMatch)) {
                isDuplicateFound = true;
                // Retain the variant with the highest score
                if (newCand.scoreResult.score > existing.scoreResult.score) {
                    logger.info({
                        msg: "Replacing lower quality duplicate",
                        removed: existing.rawTitle,
                        removedScore: existing.scoreResult.score,
                        retained: newCand.rawTitle,
                        retainedScore: newCand.scoreResult.score
                    });
                    uniqueStreams[i] = newCand;
                }
                else {
                    logger.info({
                        msg: "Skipped duplicate release with lower/equal score",
                        skipped: newCand.rawTitle,
                        skippedScore: newCand.scoreResult.score,
                        retained: existing.rawTitle,
                        retainedScore: existing.scoreResult.score
                    });
                }
                break;
            }
        }
        if (!isDuplicateFound) {
            uniqueStreams.push(newCand);
        }
    }
    return uniqueStreams;
}
//# sourceMappingURL=deduplication.js.map