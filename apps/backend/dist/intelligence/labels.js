"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = void 0;
exports.formatStreamName = formatStreamName;
exports.formatStreamTitle = formatStreamTitle;
const shared_utils_1 = require("@salvostream/shared-utils");
Object.defineProperty(exports, "formatBytes", { enumerable: true, get: function () { return shared_utils_1.formatBytes; } });
/**
 * Builds the compact, premium "name" badge shown on the left/top of Stremio's stream list.
 * Restrained format suitable for TV and mobile viewports.
 */
function formatStreamName(parsed) {
    const parts = [];
    // Resolution is the primary indicator
    if (parsed.resolution !== "unknown") {
        parts.push(parsed.resolution);
    }
    else {
        parts.push("RAW");
    }
    // Soft premium badges
    if (parsed.dolbyVision) {
        parts.push("DV");
    }
    else if (parsed.hdr) {
        parts.push("HDR");
    }
    else if (parsed.codec === "HEVC") {
        parts.push("HEVC");
    }
    else if (parsed.codec === "AV1") {
        parts.push("AV1");
    }
    return `SalvoStream\n[${parts.join(" • ")}]`;
}
/**
 * Formats the rich, structured stream description (title) for Stremio.
 * Keeps labels compact, clean, and professional.
 * Preserves the original raw title for full debuggability and transparency as a 5th line.
 */
function formatStreamTitle(rawTitle, parsed, lang, size, seeders, peers, indexer) {
    const lines = [];
    // --- Line 1: Primary Discovery Metadata (Language • Resolution • Source Type) ---
    const line1Parts = [];
    if (lang.flags && lang.flags.length > 0) {
        const flagsStr = lang.flags.join(" ");
        let langLabel = "";
        if (lang.detectedLanguage === "Hindi") {
            langLabel = "Hindi";
        }
        else if (lang.detectedLanguage === "Hindi Dubbed") {
            langLabel = "Dubbed";
        }
        else if (lang.detectedLanguage === "Dual Audio") {
            langLabel = "Dual";
        }
        else if (lang.detectedLanguage === "Multi Audio") {
            langLabel = "Multi";
        }
        else if (lang.detectedLanguage === "English") {
            langLabel = "ENG";
        }
        if (langLabel) {
            line1Parts.push(`${flagsStr} ${langLabel}`);
        }
        else {
            line1Parts.push(flagsStr);
        }
    }
    if (parsed.resolution && parsed.resolution !== "unknown") {
        line1Parts.push(parsed.resolution);
    }
    if (parsed.sourceType && parsed.sourceType !== "unknown") {
        line1Parts.push(parsed.sourceType);
    }
    if (line1Parts.length > 0) {
        lines.push(line1Parts.join(" • "));
    }
    // --- Line 2: Technical Quality Metadata (Codec • HDR/DV • Audio Format) ---
    const line2Parts = [];
    // A. Codec (prefer raw title precision: x265/x264, else fallback to parsed.codec)
    let displayCodec = "";
    if (/\bx265\b/i.test(rawTitle)) {
        displayCodec = "x265";
    }
    else if (/\bx264\b/i.test(rawTitle)) {
        displayCodec = "x264";
    }
    else if (parsed.codec && parsed.codec !== "unknown") {
        displayCodec = parsed.codec;
    }
    if (displayCodec) {
        line2Parts.push(displayCodec);
    }
    // B. HDR/Dolby Vision (premium normalized combination)
    let displayHdr = "";
    if (parsed.dolbyVision && parsed.hdr10Plus) {
        displayHdr = "DV/HDR10+";
    }
    else if (parsed.dolbyVision && parsed.hdr10) {
        displayHdr = "DV/HDR10";
    }
    else if (parsed.dolbyVision && parsed.hdr) {
        displayHdr = "DV/HDR";
    }
    else if (parsed.dolbyVision) {
        displayHdr = "DV";
    }
    else if (parsed.hdr10Plus) {
        displayHdr = "HDR10+";
    }
    else if (parsed.hdr10) {
        displayHdr = "HDR10";
    }
    else if (parsed.hdr) {
        displayHdr = "HDR";
    }
    if (displayHdr) {
        line2Parts.push(displayHdr);
    }
    // C. Audio Format (premium compact normalization)
    let displayAudio = "";
    if (parsed.audio && parsed.audio.length > 0 && !parsed.audio.includes("unknown")) {
        if (parsed.audio.includes("Atmos")) {
            displayAudio = "Atmos";
        }
        else if (parsed.audio.includes("TrueHD")) {
            displayAudio = "TrueHD";
        }
        else if (parsed.audio.includes("DTS:X")) {
            displayAudio = "DTS:X";
        }
        else if (parsed.audio.includes("DTS-HD")) {
            displayAudio = "DTS-HD MA";
        }
        else if (parsed.audio.includes("DTS")) {
            displayAudio = "DTS";
        }
        else if (parsed.audio.includes("DDP")) {
            if (parsed.audio.includes("7.1")) {
                displayAudio = "DD+ 7.1";
            }
            else if (parsed.audio.includes("5.1")) {
                displayAudio = "DD+ 5.1";
            }
            else {
                displayAudio = "DD+";
            }
        }
        else if (parsed.audio.includes("AC3")) {
            if (parsed.audio.includes("5.1")) {
                displayAudio = "DD 5.1";
            }
            else {
                displayAudio = "AC3";
            }
        }
        else if (parsed.audio.includes("AAC")) {
            if (parsed.audio.includes("5.1")) {
                displayAudio = "AAC 5.1";
            }
            else {
                displayAudio = "AAC";
            }
        }
        else if (parsed.audio.includes("7.1")) {
            displayAudio = "7.1";
        }
        else if (parsed.audio.includes("5.1")) {
            displayAudio = "5.1";
        }
    }
    if (displayAudio) {
        line2Parts.push(displayAudio);
    }
    if (line2Parts.length > 0) {
        lines.push(line2Parts.join(" • "));
    }
    // --- Line 3: Operational Metadata (Size • Seeders) ---
    const line3Parts = [];
    if (size && size > 0) {
        line3Parts.push((0, shared_utils_1.formatBytes)(size));
    }
    if (seeders !== undefined && seeders >= 0) {
        line3Parts.push(`👥 ${seeders}`);
    }
    if (line3Parts.length > 0) {
        lines.push(line3Parts.join(" • "));
    }
    // --- Line 4: Source Identity (Tracker • Release Group) ---
    const line4Parts = [];
    if (indexer) {
        let cleanIndexer = indexer.trim();
        if (cleanIndexer.toLowerCase() === "torrentgalaxy") {
            cleanIndexer = "TorrentGalaxy";
        }
        else if (cleanIndexer.toLowerCase() === "tamilblasters") {
            cleanIndexer = "TamilBlasters";
        }
        else if (cleanIndexer.toLowerCase() === "1337x") {
            cleanIndexer = "1337x";
        }
        else {
            // Capitalize word boundaries nicely
            cleanIndexer = cleanIndexer.replace(/\b\w/g, c => c.toUpperCase());
        }
        line4Parts.push(cleanIndexer);
    }
    if (parsed.releaseGroup && parsed.releaseGroup !== "unknown") {
        line4Parts.push(parsed.releaseGroup);
    }
    if (line4Parts.length > 0) {
        lines.push(line4Parts.join(" • "));
    }
    // --- Line 5: Raw title for full transparency and troubleshooting ---
    lines.push(`Original: ${rawTitle}`);
    return lines.join("\n");
}
//# sourceMappingURL=labels.js.map