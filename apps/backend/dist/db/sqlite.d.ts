import Database from "better-sqlite3";
export declare function initializeDatabase(logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
}): Database.Database;
/**
 * Checks connection health by running a read query
 */
export declare function checkDbHealth(): boolean;
/**
 * Closes database connection gracefully
 */
export declare function closeDatabase(logger: {
    info: (msg: string) => void;
}): void;
/**
 * Records a successful query for a tracker in indexer_health.
 * Updates success_count, consecutive_failures (reset to 0), status ('healthy'), last_success_at, and average_latency_ms.
 */
export declare function recordIndexerSuccess(name: string, latencyMs: number): void;
/**
 * Records a failed query for a tracker in indexer_health.
 * Updates failure_count, consecutive_failures, status ('unhealthy' if consecutive_failures >= 5), last_failure_at, and last_error_message.
 */
export declare function recordIndexerFailure(name: string, errorMessage: string): void;
/**
 * Retrieves all tracker health statistics from the indexer_health table.
 */
export declare function getIndexerHealthStats(): any[];
//# sourceMappingURL=sqlite.d.ts.map