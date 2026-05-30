"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerHealthManager = void 0;
const sqlite_js_1 = require("../db/sqlite.js");
class TrackerHealthManager {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Syncs active indexers from Prowlarr and applies soft/graceful health filtering.
     * Excludes indexers with status = 'unhealthy' (consecutive_failures >= 5).
     * Automatically falls back to full search if all trackers are unhealthy.
     *
     * @param prowlarrIndexers Configured indexers fetched from Prowlarr API
     * @returns Comma-separated list of healthy indexer IDs, or undefined if falling back to all
     */
    getHealthyIndexerIds(prowlarrIndexers) {
        if (!prowlarrIndexers || prowlarrIndexers.length === 0) {
            this.logger.info("No indexers configured in Prowlarr. Defaulting to all.");
            return undefined;
        }
        // 1. Get enabled torrent indexers
        const activeIndexers = prowlarrIndexers.filter(idx => idx.enable && idx.protocol === "torrent");
        if (activeIndexers.length === 0) {
            this.logger.warn("No active torrent indexers found in Prowlarr.");
            return undefined;
        }
        // 2. Fetch health records from SQLite
        const healthStats = (0, sqlite_js_1.getIndexerHealthStats)();
        const unhealthySet = new Set();
        for (const record of healthStats) {
            if (record.status === "unhealthy") {
                unhealthySet.add(record.indexer_name.toLowerCase());
            }
        }
        // 3. Filter indexers
        const healthyIndexers = activeIndexers.filter(idx => !unhealthySet.has(idx.name.toLowerCase()));
        this.logger.info({
            totalActiveTorrentIndexers: activeIndexers.length,
            healthyCount: healthyIndexers.length,
            unhealthySetSize: unhealthySet.size
        }, "Evaluating tracker health states");
        // 4. Fallback if ALL trackers are unhealthy - we search all rather than blocking
        if (healthyIndexers.length === 0) {
            this.logger.warn({
                unhealthyIndexers: Array.from(unhealthySet)
            }, "All active trackers are marked unhealthy! Falling back to full search mode to avoid complete pipeline block.");
            // Let Prowlarr query all of them gracefully
            return undefined;
        }
        // 5. Return comma-separated healthy indexer IDs
        const ids = healthyIndexers.map(idx => idx.id).join(",");
        this.logger.info({
            activeHealthyIndexerIds: ids,
            healthyNames: healthyIndexers.map(idx => idx.name)
        }, "Tracker health filtering completed");
        return ids;
    }
}
exports.TrackerHealthManager = TrackerHealthManager;
//# sourceMappingURL=tracker.js.map