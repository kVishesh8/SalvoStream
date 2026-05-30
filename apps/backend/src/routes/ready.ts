import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { ReadyResponse } from "@salvostream/shared-types";
import { checkDbHealth } from "../db/sqlite.js";
import { checkRedisHealth } from "../redis/client.js";

const readyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/ready", async (request, reply) => {
    const isRedisConnected = checkRedisHealth();
    const isSqliteConnected = checkDbHealth();

    const isReady = isRedisConnected && isSqliteConnected;

    const readyResponse: ReadyResponse = {
      status: isReady ? "ready" : "not_ready",
      redis: isRedisConnected,
      sqlite: isSqliteConnected,
      timestamp: new Date().toISOString()
    };

    if (isReady) {
      reply.code(200);
    } else {
      reply.code(503);
    }

    return readyResponse;
  });
};

export default readyRoutes;
