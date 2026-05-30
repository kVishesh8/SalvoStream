"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAndRenderStreams = processAndRenderStreams;
const parser_js_1 = require("./parser.js");
const language_js_1 = require("./language.js");
const scoring_js_1 = require("./scoring.js");
const filters_js_1 = require("./filters.js");
const deduplication_js_1 = require("./deduplication.js");
const labels_js_1 = require("./labels.js");
const MAX_STREAMS_LIMIT = 25;
/**
 * Orchestrates the complete Stage 3 intelligence pipeline.
 * Processes Prowlarr torrent results through:
 * 1. Filtering (spam, junk, zero-seed)
 * 2. Parsing (resolution, codecs, release groups, anime)
 * 3. Language & Audio Detection
 * 4. Quality Scoring (tiers, bonuses, penalties)
 * 5. Multi-factor Deduplication & Collapsing
 * 6. Stream Label & Badge formatting
 */
function processAndRenderStreams(results, logger) {
    logger.info({ rawResultsCount: results.length }, "Starting Stage 3 intelligence stream processing");
    const candidates = [];
    let filteredCount = 0;
    let zeroSeedCount = 0;
    // Step 1: Filter, Parse, Detect Language, and Score
    for (const item of results) {
        // A. Filter 0 seeder torrents strictly
        if (item.seeders <= 0) {
            zeroSeedCount++;
            continue;
        }
        // B. Run spam, junk, and validity filters
        const filterResult = (0, filters_js_1.filterJunkRelease)(item.title, item.magnetUrl, item.infoHash);
        if (filterResult.isSpam) {
            filteredCount++;
            logger.info({
                title: item.title,
                reason: filterResult.reason
            });
            continue;
        }
        // C. Extract valid infoHash (guaranteed to be non-null because of filterJunkRelease passing)
        const infoHash = (0, filters_js_1.parseAndValidateInfoHash)(item.magnetUrl, item.infoHash);
        // D. Release Parsing
        const parsed = (0, parser_js_1.parseTorrentName)(item.title);
        // E. Language Detection
        const lang = (0, language_js_1.detectLanguage)(item.title);
        // F. Score Calculation
        const scoreResult = (0, scoring_js_1.calculateScore)(parsed, lang, item.seeders);
        // Filter out if score is somehow 0 (sanity check)
        if (scoreResult.score <= 0) {
            filteredCount++;
            continue;
        }
        // Destructure item to avoid duplicate property compiler warnings
        const { size: itemSize, ...prowlarrData } = item;
        candidates.push({
            ...prowlarrData,
            rawTitle: item.title,
            parsed,
            scoreResult,
            size: itemSize,
            infoHash
        });
    }
    logger.info({
        totalRawResults: results.length,
        zeroSeedsFiltered: zeroSeedCount,
        spamOrJunkFiltered: filteredCount,
        preDeduplicationCandidates: candidates.length
    });
    // Step 2: Multi-factor Deduplication
    const collapsedCandidates = (0, deduplication_js_1.collapseDuplicates)(candidates, logger);
    logger.info({
        preDedupeCount: candidates.length,
        postDedupeCount: collapsedCandidates.length,
        collapsedDuplicatesCount: candidates.length - collapsedCandidates.length
    });
    // Step 3: Final Sorting by Score Descending
    const sortedCandidates = [...collapsedCandidates].sort((a, b) => b.scoreResult.score - a.scoreResult.score);
    // Step 4: Format Stream Labels and Badge Name
    const processedStreams = [];
    const limit = Math.min(sortedCandidates.length, MAX_STREAMS_LIMIT);
    for (let i = 0; i < limit; i++) {
        const candidate = sortedCandidates[i];
        const prowlarrItem = candidate;
        const name = (0, labels_js_1.formatStreamName)(candidate.parsed);
        const title = (0, labels_js_1.formatStreamTitle)(candidate.rawTitle, candidate.parsed, (0, language_js_1.detectLanguage)(candidate.rawTitle), // Safe lookup
        candidate.size, prowlarrItem.seeders, prowlarrItem.peers, prowlarrItem.indexer);
        // Log top 5 stream score details for verification and tuning
        if (i < 5) {
            logger.info({
                rank: i + 1,
                title: candidate.rawTitle,
                score: candidate.scoreResult.score,
                tier: candidate.scoreResult.qualityTier,
                language: (0, language_js_1.detectLanguage)(candidate.rawTitle).detectedLanguage,
                resolution: candidate.parsed.resolution,
                codec: candidate.parsed.codec,
                group: candidate.parsed.releaseGroup,
                seeders: prowlarrItem.seeders
            });
        }
        processedStreams.push({
            name,
            title,
            infoHash: candidate.infoHash,
            fileIdx: 0 // Play the primary/largest video file natively
        });
    }
    logger.info({
        renderedStreamsCount: processedStreams.length,
        maxLimit: MAX_STREAMS_LIMIT
    });
    return processedStreams;
}
//# sourceMappingURL=processor.js.map