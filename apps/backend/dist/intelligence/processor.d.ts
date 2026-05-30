import { ProwlarrSearchResult } from "../prowlarr/client.js";
import { StremioStream } from "@salvostream/shared-types";
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
export declare function processAndRenderStreams(results: ProwlarrSearchResult[], logger: any): StremioStream[];
//# sourceMappingURL=processor.d.ts.map