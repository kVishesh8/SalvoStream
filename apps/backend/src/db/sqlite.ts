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

    // Insert bootstrap marker to verify write works
    const insertStmt = dbInstance.prepare(`
      INSERT OR IGNORE INTO system_status (key, value) VALUES (?, ?)
    `);
    insertStmt.run("stage_1_scaffold", "completed");

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
