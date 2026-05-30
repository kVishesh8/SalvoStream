"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_js_1 = require("../db/sqlite.js");
const client_js_1 = require("../redis/client.js");
const readyRoutes = async (fastify) => {
    fastify.get("/ready", async (request, reply) => {
        const isRedisConnected = (0, client_js_1.checkRedisHealth)();
        const isSqliteConnected = (0, sqlite_js_1.checkDbHealth)();
        const isReady = isRedisConnected && isSqliteConnected;
        const readyResponse = {
            status: isReady ? "ready" : "not_ready",
            redis: isRedisConnected,
            sqlite: isSqliteConnected,
            timestamp: new Date().toISOString()
        };
        if (isReady) {
            reply.code(200);
        }
        else {
            reply.code(503);
        }
        return readyResponse;
    });
};
exports.default = readyRoutes;
//# sourceMappingURL=ready.js.map