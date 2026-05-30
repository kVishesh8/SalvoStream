import Redis from "ioredis";
import { config } from "../config/env.js";

let redisClient: Redis | null = null;
let isConnected = false;

export function initializeRedis(logger: { info: (msg: string) => void; error: (msg: string) => void }): Redis {
  if (redisClient) {
    return redisClient;
  }

  logger.info(`Connecting to Redis at: ${config.REDIS_URL}`);

  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Essential for robust queuing or caching in the future
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    }
  });

  redisClient.on("connect", () => {
    isConnected = true;
    logger.info("Connected to Redis successfully.");
  });

  redisClient.on("ready", () => {
    isConnected = true;
    logger.info("Redis client is ready.");
  });

  redisClient.on("error", (error) => {
    isConnected = false;
    logger.error(`Redis connection error: ${(error as Error).message}`);
  });

  redisClient.on("close", () => {
    isConnected = false;
    logger.info("Redis connection closed.");
  });

  return redisClient;
}

/**
 * Checks if Redis is fully connected and ready
 */
export function checkRedisHealth(): boolean {
  return isConnected && redisClient !== null && redisClient.status === "ready";
}

/**
 * Closes Redis connection gracefully
 */
export async function closeRedis(logger: { info: (msg: string) => void }): Promise<void> {
  if (redisClient) {
    logger.info("Closing Redis connection...");
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
}

/**
 * Exposes active Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}
