export interface StremioManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    resources: ("catalog" | "meta" | "stream" | "subtitles" | "addon_catalog")[];
    types: ("movie" | "series" | "anime" | "other")[];
    idPrefixes?: string[];
    background?: string;
    logo?: string;
    contactEmail?: string;
    behaviorHints?: {
        configurable?: boolean;
        configurationRequired?: boolean;
    };
}
export interface StremioStream {
    name: string;
    title: string;
    url?: string;
    ytId?: string;
    infoHash?: string;
    fileIdx?: number;
    externalUrl?: string;
    behaviorHints?: {
        countryWhitelist?: string[];
        notWebReady?: boolean;
        bingeGroup?: string;
        headers?: Record<string, string>;
    };
}
export interface StremioStreamResponse {
    streams: StremioStream[];
}
export interface HealthResponse {
    status: "healthy" | "unhealthy";
    uptime: string;
    uptimeSeconds: number;
    redis: boolean;
    sqlite: boolean;
    memoryUsage: {
        rss: string;
        heapTotal: string;
        heapUsed: string;
        external: string;
    };
    timestamp: string;
}
export interface ReadyResponse {
    status: "ready" | "not_ready";
    redis: boolean;
    sqlite: boolean;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map