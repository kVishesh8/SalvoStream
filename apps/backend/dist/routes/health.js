"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_utils_1 = require("@salvostream/shared-utils");
const sqlite_js_1 = require("../db/sqlite.js");
const client_js_1 = require("../redis/client.js");
const env_js_1 = require("../config/env.js");
const startTime = Date.now();
const healthRoutes = async (fastify) => {
    fastify.get("/health", async (request, reply) => {
        const isRedisConnected = (0, client_js_1.checkRedisHealth)();
        const isSqliteConnected = (0, sqlite_js_1.checkDbHealth)();
        // 1. Check Prowlarr connectivity
        let prowlarrConnected = false;
        try {
            const response = await fetch(`${env_js_1.config.PROWLARR_URL}/api/v1/system/status`, {
                headers: { "X-Api-Key": env_js_1.config.PROWLARR_API_KEY }
            });
            prowlarrConnected = response.ok;
        }
        catch {
            prowlarrConnected = false;
        }
        // 2. Check FlareSolverr connectivity if enabled
        let flaresolverrConnected = false;
        if (env_js_1.config.FLARESOLVERR_ENABLED) {
            try {
                const response = await fetch(`${env_js_1.config.FLARESOLVERR_URL}/health`);
                flaresolverrConnected = response.ok;
            }
            catch {
                flaresolverrConnected = false;
            }
        }
        // 3. Fetch indexer health stats from SQLite
        const indexers = (0, sqlite_js_1.getIndexerHealthStats)();
        const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const memory = process.memoryUsage();
        const healthStatus = {
            status: isRedisConnected && isSqliteConnected ? "healthy" : "unhealthy",
            uptime: (0, shared_utils_1.formatUptime)(uptimeSeconds),
            uptimeSeconds,
            redis: isRedisConnected,
            sqlite: isSqliteConnected,
            memoryUsage: {
                rss: (0, shared_utils_1.formatBytes)(memory.rss),
                heapTotal: (0, shared_utils_1.formatBytes)(memory.heapTotal),
                heapUsed: (0, shared_utils_1.formatBytes)(memory.heapUsed),
                external: (0, shared_utils_1.formatBytes)(memory.external)
            },
            trackers: {
                flaresolverrEnabled: env_js_1.config.FLARESOLVERR_ENABLED,
                flaresolverrConnected,
                prowlarrConnected,
                indexers
            },
            timestamp: new Date().toISOString()
        };
        // If unhealthy, return a 503 Service Unavailable, otherwise 200 OK
        if (healthStatus.status === "unhealthy") {
            reply.code(503);
        }
        else {
            reply.code(200);
        }
        return healthStatus;
    });
};
exports.default = healthRoutes;
//# sourceMappingURL=health.js.map