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
//# sourceMappingURL=sqlite.d.ts.map