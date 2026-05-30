import { config } from "../config/env.js";

// Helper to determine the logging level
const logLevel = config.NODE_ENV === "production" ? "info" : "debug";

// Custom request serializer to explicitly capture request details and the request ID
export const loggerConfig: any = {
  level: logLevel,
  serializers: {
    req(request: any) {
      return {
        id: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers["user-agent"]
      };
    },
    res(reply: any) {
      return {
        statusCode: reply.statusCode
      };
    }
  },
  // Pino default formats are highly readable and structured
  formatters: {
    level(label: string) {
      return { level: label.toUpperCase() };
    }
  }
};
