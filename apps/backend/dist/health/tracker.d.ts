export interface ProwlarrIndexer {
    id: number;
    name: string;
    enable: boolean;
    status: string;
    protocol: string;
}
export declare class TrackerHealthManager {
    private logger;
    constructor(logger: any);
    /**
     * Syncs active indexers from Prowlarr and applies soft/graceful health filtering.
     * Excludes indexers with status = 'unhealthy' (consecutive_failures >= 5).
     * Automatically falls back to full search if all trackers are unhealthy.
     *
     * @param prowlarrIndexers Configured indexers fetched from Prowlarr API
     * @returns Comma-separated list of healthy indexer IDs, or undefined if falling back to all
     */
    getHealthyIndexerIds(prowlarrIndexers: ProwlarrIndexer[]): string | undefined;
}
//# sourceMappingURL=tracker.d.ts.map