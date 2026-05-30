"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./logger/logger.js");
const sqlite_js_1 = require("./db/sqlite.js");
const client_js_1 = require("./redis/client.js");
const client_js_2 = require("./prowlarr/client.js");
// Routes
const manifest_js_1 = __importDefault(require("./routes/manifest.js"));
const health_js_1 = __importDefault(require("./routes/health.js"));
const ready_js_1 = __importDefault(require("./routes/ready.js"));
const stream_js_1 = __importDefault(require("./routes/stream.js"));
async function startServer() {
    // 1. Initialize Fastify with structured logger options
    const fastify = (0, fastify_1.default)({
        logger: logger_js_1.loggerConfig,
        disableRequestLogging: false // Logs every request automatically
    });
    fastify.log.info("Starting SalvoStream Backend...");
    try {
        // 2. Log configuration summary
        (0, env_js_1.logConfigSummary)(fastify.log);
        // 3. Initialize Database Connection (better-sqlite3)
        (0, sqlite_js_1.initializeDatabase)(fastify.log);
        // 4. Initialize Redis Connection (ioredis)
        (0, client_js_1.initializeRedis)(fastify.log);
        // 4.5. Check FlareSolverr connectivity gracefully if enabled
        const prowlarr = new client_js_2.ProwlarrClient(fastify.log);
        prowlarr.verifyFlareSolverrConnectivity().catch(err => {
            fastify.log.warn(`FlareSolverr check failed: ${err.message}`);
        });
        // 5. Register Routes
        await fastify.register(manifest_js_1.default);
        await fastify.register(health_js_1.default);
        await fastify.register(ready_js_1.default);
        await fastify.register(stream_js_1.default);
        // 6. Listen on specified PORT and 0.0.0.0 (required for Docker access)
        const address = await fastify.listen({
            port: env_js_1.config.PORT,
            host: "0.0.0.0"
        });
        fastify.log.info(`SalvoStream server is listening on ${address}`);
    }
    catch (error) {
        fastify.log.error(`Server failed to start: ${error.message}`);
        process.exit(1);
    }
    // Graceful shutdown handler
    async function shutdown(signal) {
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
            (0, sqlite_js_1.closeDatabase)(fastify.log);
            // 3. Close Redis connection
            await (0, client_js_1.closeRedis)(fastify.log);
            clearTimeout(forceExitTimeout);
            fastify.log.info("SalvoStream Backend shut down cleanly.");
            process.exit(0);
        }
        catch (error) {
            fastify.log.error(`Error during graceful shutdown: ${error.message}`);
            process.exit(1);
        }
    }
    // Bind shutdown triggers
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
startServer();
//# sourceMappingURL=server.js.map