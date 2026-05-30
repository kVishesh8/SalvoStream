import Fastify from "fastify";
import { config, logConfigSummary } from "./config/env.js";
import { loggerConfig } from "./logger/logger.js";
import { initializeDatabase, closeDatabase } from "./db/sqlite.js";
import { initializeRedis, closeRedis } from "./redis/client.js";
import { ProwlarrClient } from "./prowlarr/client.js";

// Routes
import manifestRoutes from "./routes/manifest.js";
import healthRoutes from "./routes/health.js";
import readyRoutes from "./routes/ready.js";
import streamRoutes from "./routes/stream.js";

async function startServer() {
  // 1. Initialize Fastify with structured logger options
  const fastify = Fastify({
    logger: loggerConfig,
    disableRequestLogging: false // Logs every request automatically
  });

  fastify.log.info("Starting SalvoStream Backend...");

  try {
    // 2. Log configuration summary
    logConfigSummary(fastify.log);

    // 3. Initialize Database Connection (better-sqlite3)
    initializeDatabase(fastify.log);

    // 4. Initialize Redis Connection (ioredis)
    initializeRedis(fastify.log);

    // 4.5. Check FlareSolverr connectivity gracefully if enabled
    const prowlarr = new ProwlarrClient(fastify.log);
    prowlarr.verifyFlareSolverrConnectivity().catch(err => {
      fastify.log.warn(`FlareSolverr check failed: ${err.message}`);
    });

    // 5. Register Routes
    await fastify.register(manifestRoutes);
    await fastify.register(healthRoutes);
    await fastify.register(readyRoutes);
    await fastify.register(streamRoutes);

    // 6. Listen on specified PORT and 0.0.0.0 (required for Docker access)
    const address = await fastify.listen({
      port: config.PORT,
      host: "0.0.0.0"
    });

    fastify.log.info(`SalvoStream server is listening on ${address}`);
  } catch (error) {
    fastify.log.error(`Server failed to start: ${(error as Error).message}`);
    process.exit(1);
  }

  // Graceful shutdown handler
  async function shutdown(signal: string) {
    fastify.log.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      // Set a timeout for shutdown to prevent hanging
      const forceExitTimeout = setTimeout(() => {
        fastify.log.error("Graceful shutdown timed out, force exiting.");
        process.exit(1);
      }, 10000);

      // 1. Stop accepting new HTTP requests
      fastify.log.info("Closing Fastify HTTP server...");
      await fastify.close();

      // 2. Close SQLite connection
      closeDatabase(fastify.log);

      // 3. Close Redis connection
      await closeRedis(fastify.log);

      clearTimeout(forceExitTimeout);
      fastify.log.info("SalvoStream Backend shut down cleanly.");
      process.exit(0);
    } catch (error) {
      fastify.log.error(`Error during graceful shutdown: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  // Bind shutdown triggers
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
