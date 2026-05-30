export interface Config {
    PORT: number;
    REDIS_URL: string;
    SQLITE_PATH: string;
    NODE_ENV: string;
    PROWLARR_URL: string;
    PROWLARR_API_KEY: string;
    FLARESOLVERR_ENABLED: boolean;
    FLARESOLVERR_URL: string;
}
export declare const config: Config;
export declare function logConfigSummary(logger: {
    info: (msg: string) => void;
}): void;
//# sourceMappingURL=env.d.ts.map