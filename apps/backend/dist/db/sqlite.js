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
        // Insert bootstrap marker to verify write works
        const insertStmt = dbInstance.prepare(`
      INSERT OR IGNORE INTO system_status (key, value) VALUES (?, ?)
    `);
        insertStmt.run("stage_1_scaffold", "completed");
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
//# sourceMappingURL=sqlite.js.map