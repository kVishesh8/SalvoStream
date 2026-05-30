export const ADDON_ID = "org.salvostream";
export const ADDON_NAME = "SalvoStream";
export const ADDON_VERSION = "0.1.0";
export const ADDON_DESCRIPTION = "SalvoStream modular monolith Stremio addon - Stage 1 scaffold. hindi-first streaming, anime support, debrid orchestration, torrent intelligence (Stage 1 skeleton).";

export const STREMIO_RESOURCES = ["stream"] as const;
export const STREMIO_TYPES = ["movie", "series"] as const;

export const DEFAULT_PORT = 3000;
export const DEFAULT_SQLITE_PATH = "data/salvostream.db";
export const DEFAULT_REDIS_URL = "redis://localhost:6379";
export const DEFAULT_NODE_ENV = "development";
