import Redis from "ioredis";
export declare function initializeRedis(logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
}): Redis;
/**
 * Checks if Redis is fully connected and ready
 */
export declare function checkRedisHealth(): boolean;
/**
 * Closes Redis connection gracefully
 */
export declare function closeRedis(logger: {
    info: (msg: string) => void;
}): Promise<void>;
/**
 * Exposes active Redis client instance
 */
export declare function getRedisClient(): Redis | null;
//# sourceMappingURL=client.d.ts.map