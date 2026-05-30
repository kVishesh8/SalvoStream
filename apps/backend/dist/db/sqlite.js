"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.checkDbHealth = checkDbHealth;
exports.closeDatabase = closeDatabase;
exports.recordIndexerSuccess = recordIndexerSuccess;
exports.recordIndexerFailure = recordIndexerFailure;
exports.getIndexerHealthStats = getIndexerHealthStats;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const env_js_1 = require("../config/env.js");
let dbInstance = null;
function initializeDatabase(logger) {
    if (dbInstance) {
        return dbInstance;
    }
    const dbPath = env_js_1.config.SQLITE_PATH;
    const dbDir = path.dirname(dbPath);
    try {
        // 1. Ensure the parent directory of the database file exists
        if (!fs.existsSync(dbDir)) {
            logger.info(`Creating database directory at: ${dbDir}`);
            fs.mkdirSync(dbDir, { recursive: true });
        }
        logger.info(`Initializing SQLite database at: ${dbPath}`);
        // 2. Open / Create the database
        dbInstance = new better_sqlite3_1.default(dbPath, {
            fileMustExist: false,
            timeout: 5000
        });
        // Enable WAL mode for better performance/concurrency
        dbInstance.pragma("journal_mode = WAL");
        // 3. Lightweight schema initialization
        dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Stage 3.5: Tracker Health Table
        dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS indexer_health (
        indexer_name TEXT PRIMARY KEY,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        consecutive_failures INTEGER DEFAULT 0,
        last_success_at DATETIME,
        last_failure_at DATETIME,
        last_error_message TEXT,
        average_latency_ms REAL DEFAULT 0,
        status TEXT DEFAULT 'healthy',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Insert bootstrap marker to verify write works
        const insertStmt = dbInstance.prepare(`
      INSERT OR IGNORE INTO system_status (key, value) VALUES (?, ?)
    `);
        insertStmt.run("stage_1_scaffold", "completed");
        // Heal previous faulty 'undefined' or contaminated timeout entries from stage 3.5 bugs
        dbInstance.exec(`
      UPDATE indexer_health
      SET consecutive_failures = 0, status = 'healthy', last_error_message = NULL
      WHERE last_error_message LIKE '%undefined%' OR last_error_message LIKE '%Query Timeout%';
    `);
        logger.info("SQLite database bootstrapped successfully.");
        return dbInstance;
    }
    catch (error) {
        logger.error(`Failed to initialize SQLite database: ${error.message}`);
        throw error;
    }
}
/**
 * Checks connection health by running a read query
 */
function checkDbHealth() {
    if (!dbInstance)
        return false;
    try {
        const result = dbInstance.prepare("SELECT value FROM system_status WHERE key = ?").get("stage_1_scaffold");
        return result?.value === "completed";
    }
    catch {
        return false;
    }
}
/**
 * Closes database connection gracefully
 */
function closeDatabase(logger) {
    if (dbInstance) {
        logger.info("Closing SQLite database connection...");
        dbInstance.close();
        dbInstance = null;
    }
}
/**
 * Records a successful query for a tracker in indexer_health.
 * Updates success_count, consecutive_failures (reset to 0), status ('healthy'), last_success_at, and average_latency_ms.
 */
function recordIndexerSuccess(name, latencyMs) {
    if (!dbInstance)
        return;
    try {
        const updateStmt = dbInstance.prepare(`
      INSERT INTO indexer_health (indexer_name, success_count, consecutive_failures, last_success_at, average_latency_ms, status, updated_at)
      VALUES (?, 1, 0, datetime('now'), ?, 'healthy', datetime('now'))
      ON CONFLICT(indexer_name) DO UPDATE SET
        success_count = success_count + 1,
        consecutive_failures = 0,
        last_success_at = datetime('now'),
        average_latency_ms = (average_latency_ms * 0.8) + (? * 0.2),
        status = 'healthy',
        updated_at = datetime('now')
    `);
        updateStmt.run(name, latencyMs, latencyMs);
    }
    catch {
        // Suppress db helper errors silently to avoid disrupting search requests
    }
}
/**
 * Records a failed query for a tracker in indexer_health.
 * Updates failure_count, consecutive_failures, status ('unhealthy' if consecutive_failures >= 5), last_failure_at, and last_error_message.
 */
function recordIndexerFailure(name, errorMessage) {
    if (!dbInstance)
        return;
    try {
        const updateStmt = dbInstance.prepare(`
      INSERT INTO indexer_health (indexer_name, failure_count, consecutive_failures, last_failure_at, last_error_message, status, updated_at)
      VALUES (?, 1, 1, datetime('now'), ?, 'healthy', datetime('now'))
      ON CONFLICT(indexer_name) DO UPDATE SET
        failure_count = failure_count + 1,
        consecutive_failures = consecutive_failures + 1,
        last_failure_at = datetime('now'),
        last_error_message = ?,
        status = CASE WHEN consecutive_failures + 1 >= 5 THEN 'unhealthy' ELSE 'healthy' END,
        updated_at = datetime('now')
    `);
        updateStmt.run(name, errorMessage, errorMessage);
    }
    catch {
        // Suppress db helper errors silently to avoid disrupting search requests
    }
}
/**
 * Retrieves all tracker health statistics from the indexer_health table.
 */
function getIndexerHealthStats() {
    if (!dbInstance)
        return [];
    try {
        const stmt = dbInstance.prepare("SELECT * FROM indexer_health ORDER BY indexer_name ASC");
        return stmt.all();
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=sqlite.js.map