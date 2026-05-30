export interface ProwlarrSearchResult {
    title: string;
    size: number;
    seeders: number;
    peers: number;
    magnetUrl?: string;
    downloadUrl?: string;
    indexer: string;
    infoHash?: string;
}
export declare class ProwlarrClient {
    private url;
    private apiKey;
    private logger;
    constructor(logger: any);
    /**
     * Verifies FlareSolverr connectivity and logs setup guidance.
     * Treats FlareSolverr as an optional enhancement.
     */
    verifyFlareSolverrConnectivity(): Promise<boolean>;
    /**
     * Queries Prowlarr for search results using the generated query.
     */
    search(query: string, type: "movie" | "series"): Promise<ProwlarrSearchResult[]>;
}
//# sourceMappingURL=client.d.ts.map