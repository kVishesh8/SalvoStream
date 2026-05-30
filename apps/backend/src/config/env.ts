import * as dotenv from "dotenv";
import * as path from "path";
import {
  DEFAULT_PORT,
  DEFAULT_REDIS_URL,
  DEFAULT_SQLITE_PATH,
  DEFAULT_NODE_ENV
} from "@salvostream/shared-constants";

// Load environment variables from .env if present
dotenv.config();

export interface Config {
  PORT: number;
  REDIS_URL: string;
  SQLITE_PATH: string;
  NODE_ENV: string;
  PROWLARR_URL: string;
  PROWLARR_API_KEY: string;
}

const rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
const port = isNaN(rawPort) ? DEFAULT_PORT : rawPort;

export const config: Config = {
  PORT: port,
  REDIS_URL: process.env.REDIS_URL || DEFAULT_REDIS_URL,
  SQLITE_PATH: process.env.SQLITE_PATH || DEFAULT_SQLITE_PATH,
  NODE_ENV: process.env.NODE_ENV || DEFAULT_NODE_ENV,
  PROWLARR_URL: process.env.PROWLARR_URL || "http://localhost:9696",
  PROWLARR_API_KEY: process.env.PROWLARR_API_KEY || ""
};

// Logs clean startup configuration summary (hiding credentials if present)
export function logConfigSummary(logger: { info: (msg: string) => void }): void {
  const sanitizedRedis = config.REDIS_URL.replace(/:[^:@]+@/, ":****@");
  const sanitizedApiKey = config.PROWLARR_API_KEY
    ? `${config.PROWLARR_API_KEY.slice(0, 4)}****`
    : "not configured";

  logger.info(`Configuration loaded:`);
  logger.info(`  - NODE_ENV: ${config.NODE_ENV}`);
  logger.info(`  - PORT: ${config.PORT}`);
  logger.info(`  - SQLITE_PATH: ${config.SQLITE_PATH}`);
  logger.info(`  - REDIS_URL: ${sanitizedRedis}`);
  logger.info(`  - PROWLARR_URL: ${config.PROWLARR_URL}`);
  logger.info(`  - PROWLARR_API_KEY: ${sanitizedApiKey}`);
}
