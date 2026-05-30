import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config/env.js";

let dbInstance: Database.Database | null = null;

export function initializeDatabase(logger: { info: (msg: string) => void; error: (msg: string) => void }): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = config.SQLITE_PATH;
  const dbDir = path.dirname(dbPath);

  try {
    // 1. Ensure the parent directory of the database file exists
    if (!fs.existsSync(dbDir)) {
      logger.info(`Creating database directory at: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    logger.info(`Initializing SQLite database at: ${dbPath}`);
    
    // 2. Open / Create the database
    dbInstance = new Database(dbPath, {
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
  } catch (error) {
    logger.error(`Failed to initialize SQLite database: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Checks connection health by running a read query
 */
export function checkDbHealth(): boolean {
  if (!dbInstance) return false;
  try {
    const result = dbInstance.prepare("SELECT value FROM system_status WHERE key = ?").get("stage_1_scaffold") as { value: string } | undefined;
    return result?.value === "completed";
  } catch {
    return false;
  }
}

/**
 * Closes database connection gracefully
 */
export function closeDatabase(logger: { info: (msg: string) => void }): void {
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
export function recordIndexerSuccess(name: string, latencyMs: number): void {
  if (!dbInstance) return;
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
  } catch {
    // Suppress db helper errors silently to avoid disrupting search requests
  }
}

/**
 * Records a failed query for a tracker in indexer_health.
 * Updates failure_count, consecutive_failures, status ('unhealthy' if consecutive_failures >= 5), last_failure_at, and last_error_message.
 */
export function recordIndexerFailure(name: string, errorMessage: string): void {
  if (!dbInstance) return;
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
  } catch {
    // Suppress db helper errors silently to avoid disrupting search requests
  }
}

/**
 * Retrieves all tracker health statistics from the indexer_health table.
 */
export function getIndexerHealthStats(): any[] {
  if (!dbInstance) return [];
  try {
    const stmt = dbInstance.prepare("SELECT * FROM indexer_health ORDER BY indexer_name ASC");
    return stmt.all();
  } catch {
    return [];
  }
}
