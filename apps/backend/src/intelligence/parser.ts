export interface ParsedRelease {
  resolution: "2160p" | "1080p" | "720p" | "480p" | "576p" | "unknown";
  sourceType: "WEB-DL" | "WEBRip" | "BluRay" | "HDTV" | "CAM" | "TeleSync" | "DVD" | "unknown";
  codec: "HEVC" | "AVC" | "AV1" | "unknown";
  hdr: boolean;
  dolbyVision: boolean;
  hdr10Plus?: boolean;
  hdr10?: boolean;
  audio: ("Atmos" | "TrueHD" | "DTS-HD" | "DTS:X" | "DTS" | "DDP" | "5.1" | "7.1" | "AAC" | "AC3" | "unknown")[];
  releaseGroup: string; // Defaults to "unknown"
  season?: number;
  episode?: number;
  isAnime: boolean;
  animeFansubGroup: string; // Defaults to "unknown"
  animeEpisode?: number;
  ott: ("Netflix" | "AmazonPrime" | "DisneyHotstar" | "JioCinema")[];
}

const COMMON_GROUPS = [
  "FraMeSToR",
  "CtrlHD",
  "QxR",
  "Tigole",
  "PSA",
  "YIFY",
  "RARBG",
  "GalaxyRG",
  "FGT",
  "silence",
  "GanoLa",
  "YTS",
  "Vyto",
  "Joy",
  "MiNX",
  "NTb",
  "FLUX",
  "KOGi",
  "WiKi",
  "CHD",
  "D-Z0N3",
  "DON",
  "TayTO",
  "HONE",
  "playBD",
  "BONE",
  "TermiNAL",
  "APEX",
  "EVO",
  "ION10",
  "AMRAP",
  "Vyndros",
  "d3g",
  "Pahe",
  "SHeRLaK",
  "DRONES",
  "SPiRiT",
  "GECKOS",
  "ROVERS",
  "SPARKS",
  "COCoain",
  "TombDoc",
  "GZ",
  "ShAaNiG",
  "TGx",
  "SubsPlease",
  "Erai-raws",
  "Judas",
  "HorribleSubs"
];

/**
 * Parses a torrent title to extract structured metadata.
 * Highly robust, deterministic, and degrades gracefully with "unknown" values.
 */
export function parseTorrentName(title: string): ParsedRelease {
  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();

  // 1. Resolution Extraction
  let resolution: ParsedRelease["resolution"] = "unknown";
  if (/\b(2160p|4k|uhd)\b/i.test(lowerTitle)) {
    resolution = "2160p";
  } else if (/\b(1080p|fhd)\b/i.test(lowerTitle)) {
    resolution = "1080p";
  } else if (/\b(720p|hd)\b/i.test(lowerTitle)) {
    resolution = "720p";
  } else if (/\b(480p|sd)\b/i.test(lowerTitle)) {
    resolution = "480p";
  } else if (/\b(576p)\b/i.test(lowerTitle)) {
    resolution = "576p";
  }

  // 2. Source Type Extraction
  let sourceType: ParsedRelease["sourceType"] = "unknown";
  if (/\b(web[-._]?dl|webrip|web[-._]?rip|web[-._]?tv|web)\b/i.test(lowerTitle)) {
    if (/\b(webrip|web[-._]?rip)\b/i.test(lowerTitle)) {
      sourceType = "WEBRip";
    } else {
      sourceType = "WEB-DL";
    }
  } else if (/\b(bluray|blu[-._]?ray|bdrip|brrip|bd[-._]?rip|bd)\b/i.test(lowerTitle)) {
    sourceType = "BluRay";
  } else if (/\b(hdtv|hd[-._]?tv|dsr|dsrip)\b/i.test(lowerTitle)) {
    sourceType = "HDTV";
  } else if (/\b(camrip|cam[-._]?rip|cam|hdcam|screener|scr|dvdscr|tc|telecine)\b/i.test(lowerTitle)) {
    sourceType = "CAM";
  } else if (/\b(ts|telesync|hd[-._]?ts)\b/i.test(lowerTitle)) {
    sourceType = "TeleSync";
  } else if (/\b(dvd|dvdrip|r5)\b/i.test(lowerTitle)) {
    sourceType = "DVD";
  }

  // 3. Codec Extraction
  let codec: ParsedRelease["codec"] = "unknown";
  if (/\b(x265|h265|hevc)\b/i.test(lowerTitle)) {
    codec = "HEVC";
  } else if (/\b(x264|h264|avc)\b/i.test(lowerTitle)) {
    codec = "AVC";
  } else if (/\b(av1)\b/i.test(lowerTitle)) {
    codec = "AV1";
  }

  // 4. HDR & Dolby Vision
  const dolbyVision = /\b(dv|dovi|dolby[-._]?vision)\b/i.test(lowerTitle);
  const hdr10Plus = /\bhdr10\+/i.test(lowerTitle) || /\bhdr10plus\b/i.test(lowerTitle);
  const hdr10 = /\b(hdr10)\b/i.test(lowerTitle);
  const generalHdr = /\b(hdr|10bit)\b/i.test(lowerTitle);
  const isSdr = /\bsdr\b/i.test(lowerTitle);
  const hdr = !isSdr && (dolbyVision || hdr10Plus || hdr10 || generalHdr);

  // 5. Audio Markers
  const audio: ParsedRelease["audio"] = [];
  if (/\b(atmos)\b/i.test(lowerTitle)) {
    audio.push("Atmos");
  }
  if (/\b(truehd|true[-._]?hd)\b/i.test(lowerTitle)) {
    audio.push("TrueHD");
  }
  if (/\b(dts[-._]?x)\b/i.test(lowerTitle)) {
    audio.push("DTS:X");
  } else if (/\b(dts[-._]?hd|dts[-._]?ma)\b/i.test(lowerTitle)) {
    audio.push("DTS-HD");
  } else if (/\b(dts)\b/i.test(lowerTitle)) {
    audio.push("DTS");
  }
  if (/\b(ddp|dd\+|eac3|dolby[-._]?digital[-._]?plus|dolby[-._]?digital\+)\b/i.test(lowerTitle)) {
    audio.push("DDP");
  }
  if (/\b(5\.1|5\s1|ch5\.1|6ch)\b/i.test(lowerTitle)) {
    audio.push("5.1");
  }
  if (/\b(7\.1|7\s1|ch7\.1|8ch)\b/i.test(lowerTitle)) {
    audio.push("7.1");
  }
  if (/\b(aac)\b/i.test(lowerTitle)) {
    audio.push("AAC");
  }
  if (/\b(ac3)\b/i.test(lowerTitle)) {
    audio.push("AC3");
  }
  if (audio.length === 0) {
    audio.push("unknown");
  }

  // 6. Season and Episode Parsing (Standard: S01E02, S1E2, Season 1, etc.)
  let season: number | undefined;
  let episode: number | undefined;

  const standardMatch = cleanTitle.match(/\bS(\d+)\s*E(\d+)\b/i);
  if (standardMatch) {
    season = parseInt(standardMatch[1], 10);
    episode = parseInt(standardMatch[2], 10);
  } else {
    const seasonMatch = cleanTitle.match(/\bSeason\s*(\d+)\b/i);
    if (seasonMatch) {
      season = parseInt(seasonMatch[1], 10);
    }
    const episodeMatch = cleanTitle.match(/\b(E|Ep|Episode)\s*(\d+)\b/i);
    if (episodeMatch) {
      episode = parseInt(episodeMatch[2], 10);
    }
  }

  // 7. Anime markers and fansub groups
  let isAnime = false;
  let animeFansubGroup = "unknown";
  let animeEpisode: number | undefined;

  const animeGroupMatch = cleanTitle.match(/^\[([^\]]+)\]/);
  if (animeGroupMatch) {
    const groupName = animeGroupMatch[1].trim();
    const notGroup = /^(2160p|1080p|720p|480p|hdr|hevc|x265|x264|dual[-._]?audio|multi[-._]?audio)$/i.test(groupName);
    if (!notGroup) {
      isAnime = true;
      animeFansubGroup = groupName;
    }
  }

  const animeEpMatch = cleanTitle.match(/\s+-\s+(\d+)(?:v\d+)?\b/);
  if (animeEpMatch) {
    isAnime = true;
    animeEpisode = parseInt(animeEpMatch[1], 10);
  }

  if (!isAnime && /\b(subsplease|erai-raws|judas|subs[-._]?please|horriblesubs|anirelease)\b/i.test(lowerTitle)) {
    isAnime = true;
  }

  // 8. Release Group Extraction
  let releaseGroup = "unknown";

  if (isAnime && animeFansubGroup !== "unknown") {
    releaseGroup = animeFansubGroup;
  } else {
    const titleWithoutExt = cleanTitle.replace(/\.(mkv|mp4|avi|ts|m2ts)$/i, "").trim();

    // A. Match from prioritized dictionary of common release groups at the end of title
    // Match preceded by dot, hyphen, space, bracket, or parenthesis
    const groupRegex = new RegExp(`[\\b\\-\\.\\[\\(\\s](${COMMON_GROUPS.join("|")})[\\]\\)\\b\\s]*$`, "i");
    const dictMatch = titleWithoutExt.match(groupRegex);
    if (dictMatch) {
      const matchedName = dictMatch[1];
      const exactGroup = COMMON_GROUPS.find(g => g.toLowerCase() === matchedName.toLowerCase());
      if (exactGroup) {
        releaseGroup = exactGroup;
      }
    }

    // B. Heuristic fallback for standard Scene/P2P hyphenated naming (e.g., Title-Group)
    if (releaseGroup === "unknown") {
      const parts = titleWithoutExt.split("-");
      if (parts.length > 1) {
        const potentialGroup = parts[parts.length - 1].trim();
        const invalidGroupKeywords = /^(2160p|1080p|720p|480p|hevc|x265|x264|h264|h265|web|webdl|web-dl|bluray|hdtv|cam|ts|dd5|dd2|ddp|dts|aac|ac3|atmos|hdr|dual|multi|10bit|sdr)$/i;
        if (
          potentialGroup.length > 0 &&
          potentialGroup.length < 15 &&
          !/\s/.test(potentialGroup) &&
          !invalidGroupKeywords.test(potentialGroup)
        ) {
          releaseGroup = potentialGroup.replace(/[\[\]\(\)]/g, "");
        }
      }
    }
  }

  // 9. OTT Marker Extraction (Strict word boundaries to avoid false positives)
  const ott: ParsedRelease["ott"] = [];
  if (/\b(nf|netflix)\b/i.test(lowerTitle)) {
    ott.push("Netflix");
  }
  if (/\b(amzn|amazon|prime)\b/i.test(lowerTitle)) {
    ott.push("AmazonPrime");
  }
  if (/\b(dsnp|hotstar|disney)\b/i.test(lowerTitle)) {
    ott.push("DisneyHotstar");
  }
  if (/\b(jiocinema)\b/i.test(lowerTitle)) {
    ott.push("JioCinema");
  }

  return {
    resolution,
    sourceType,
    codec,
    hdr,
    dolbyVision,
    hdr10Plus,
    hdr10,
    audio,
    releaseGroup,
    season,
    episode,
    isAnime,
    animeFansubGroup,
    animeEpisode,
    ott
  };
}
