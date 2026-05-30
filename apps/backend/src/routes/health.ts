import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { HealthResponse } from "@salvostream/shared-types";
import { formatUptime, formatBytes } from "@salvostream/shared-utils";
import { checkDbHealth } from "../db/sqlite.js";
import { checkRedisHealth } from "../redis/client.js";

const startTime = Date.now();

const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/health", async (request, reply) => {
    const isRedisConnected = checkRedisHealth();
    const isSqliteConnected = checkDbHealth();

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memory = process.memoryUsage();

    const healthStatus: HealthResponse = {
      status: isRedisConnected && isSqliteConnected ? "healthy" : "unhealthy",
      uptime: formatUptime(uptimeSeconds),
      uptimeSeconds,
      redis: isRedisConnected,
      sqlite: isSqliteConnected,
      memoryUsage: {
        rss: formatBytes(memory.rss),
        heapTotal: formatBytes(memory.heapTotal),
        heapUsed: formatBytes(memory.heapUsed),
        external: formatBytes(memory.external)
      },
      timestamp: new Date().toISOString()
    };

    // If unhealthy, return a 503 Service Unavailable, otherwise 200 OK
    if (healthStatus.status === "unhealthy") {
      reply.code(503);
    } else {
      reply.code(200);
    }

    return healthStatus;
  });
};

export default healthRoutes;
