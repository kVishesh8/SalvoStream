export interface ParsedRelease {
    resolution: "2160p" | "1080p" | "720p" | "480p" | "576p" | "unknown";
    sourceType: "WEB-DL" | "WEBRip" | "BluRay" | "HDTV" | "CAM" | "TeleSync" | "DVD" | "unknown";
    codec: "HEVC" | "AVC" | "AV1" | "unknown";
    hdr: boolean;
    dolbyVision: boolean;
    audio: ("Atmos" | "DDP" | "DTS" | "5.1" | "7.1" | "AAC" | "AC3" | "unknown")[];
    releaseGroup: string;
    season?: number;
    episode?: number;
    isAnime: boolean;
    animeFansubGroup: string;
    animeEpisode?: number;
}
/**
 * Parses a torrent title to extract structured metadata.
 * Highly robust, deterministic, and degrades gracefully with "unknown" values.
 */
export declare function parseTorrentName(title: string): ParsedRelease;
//# sourceMappingURL=parser.d.ts.map