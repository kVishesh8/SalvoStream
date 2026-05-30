import { ProwlarrSearchResult } from "../prowlarr/client.js";
import { StremioStream } from "@salvostream/shared-types";
import { parseTorrentName } from "./parser.js";
import { detectLanguage } from "./language.js";
import { calculateScore } from "./scoring.js";
import { filterJunkRelease, parseAndValidateInfoHash } from "./filters.js";
import { collapseDuplicates, EnhancedCandidate } from "./deduplication.js";
import { formatStreamName, formatStreamTitle } from "./labels.js";

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
export function processAndRenderStreams(
  results: ProwlarrSearchResult[],
  logger: any
): StremioStream[] {
  logger.info({ rawResultsCount: results.length }, "Starting Stage 3 intelligence stream processing");

  const candidates: EnhancedCandidate[] = [];
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
    const filterResult = filterJunkRelease(item.title, item.magnetUrl, item.infoHash);
    if (filterResult.isSpam) {
      filteredCount++;
      logger.info({
        title: item.title,
        reason: filterResult.reason
      }, "Filtered out junk/spam release");
      continue;
    }

    // C. Extract valid infoHash (guaranteed to be non-null because of filterJunkRelease passing)
    const infoHash = parseAndValidateInfoHash(item.magnetUrl, item.infoHash)!;

    // D. Release Parsing
    const parsed = parseTorrentName(item.title);

    // E. Language Detection
    const lang = detectLanguage(item.title);

    // F. Score Calculation
    const scoreResult = calculateScore(parsed, lang, item.seeders);

    // Filter out if score is <= 0 (sanity check)
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
    } as EnhancedCandidate);
  }

  logger.info({
    totalRawResults: results.length,
    zeroSeedsFiltered: zeroSeedCount,
    spamOrJunkFiltered: filteredCount,
    preDeduplicationCandidates: candidates.length
  });

  // Step 2: Multi-factor Deduplication
  const collapsedCandidates = collapseDuplicates(candidates, logger);

  logger.info({
    preDedupeCount: candidates.length,
    postDedupeCount: collapsedCandidates.length,
    collapsedDuplicatesCount: candidates.length - collapsedCandidates.length
  });

  // Step 3: Final Sorting by Score Descending
  const sortedCandidates = [...collapsedCandidates].sort(
    (a, b) => b.scoreResult.score - a.scoreResult.score
  );

  // Step 4: Format Stream Labels and Badge Name
  const processedStreams: StremioStream[] = [];
  const limit = Math.min(sortedCandidates.length, MAX_STREAMS_LIMIT);

  for (let i = 0; i < limit; i++) {
    const candidate = sortedCandidates[i];
    const prowlarrItem = candidate as unknown as ProwlarrSearchResult;

    const name = formatStreamName(candidate.parsed);
    const title = formatStreamTitle(
      candidate.rawTitle,
      candidate.parsed,
      detectLanguage(candidate.rawTitle), // Safe lookup
      candidate.size,
      prowlarrItem.seeders,
      prowlarrItem.peers,
      prowlarrItem.indexer
    );

    // Log top 5 stream score details for verification and tuning
    if (i < 5) {
      logger.info({
        rank: i + 1,
        title: candidate.rawTitle,
        score: candidate.scoreResult.score,
        tier: candidate.scoreResult.qualityTier,
        language: detectLanguage(candidate.rawTitle).detectedLanguage,
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
