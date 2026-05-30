"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRedis = initializeRedis;
exports.checkRedisHealth = checkRedisHealth;
exports.closeRedis = closeRedis;
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = require("../config/env.js");
let redisClient = null;
let isConnected = false;
function initializeRedis(logger) {
    if (redisClient) {
        return redisClient;
    }
    logger.info(`Connecting to Redis at: ${env_js_1.config.REDIS_URL}`);
    redisClient = new ioredis_1.default(env_js_1.config.REDIS_URL, {
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
        logger.error(`Redis connection error: ${error.message}`);
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
function checkRedisHealth() {
    return isConnected && redisClient !== null && redisClient.status === "ready";
}
/**
 * Closes Redis connection gracefully
 */
async function closeRedis(logger) {
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
function getRedisClient() {
    return redisClient;
}
//# sourceMappingURL=client.js.map