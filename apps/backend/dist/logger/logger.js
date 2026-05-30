"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerConfig = void 0;
const env_js_1 = require("../config/env.js");
// Helper to determine the logging level
const logLevel = env_js_1.config.NODE_ENV === "production" ? "info" : "debug";
// Custom request serializer to explicitly capture request details and the request ID
exports.loggerConfig = {
    level: logLevel,
    serializers: {
        req(request) {
            return {
                id: request.id,
                method: request.method,
                url: request.url,
                ip: request.ip,
                userAgent: request.headers["user-agent"]
            };
        },
        res(reply) {
            return {
                statusCode: reply.statusCode
            };
        }
    },
    // Pino default formats are highly readable and structured
    formatters: {
        level(label) {
            return { level: label.toUpperCase() };
        }
    }
};
//# sourceMappingURL=logger.js.map