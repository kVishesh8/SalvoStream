"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.logConfigSummary = logConfigSummary;
const dotenv = __importStar(require("dotenv"));
const shared_constants_1 = require("@salvostream/shared-constants");
// Load environment variables from .env if present
dotenv.config();
const rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : shared_constants_1.DEFAULT_PORT;
const port = isNaN(rawPort) ? shared_constants_1.DEFAULT_PORT : rawPort;
exports.config = {
    PORT: port,
    REDIS_URL: process.env.REDIS_URL || shared_constants_1.DEFAULT_REDIS_URL,
    SQLITE_PATH: process.env.SQLITE_PATH || shared_constants_1.DEFAULT_SQLITE_PATH,
    NODE_ENV: process.env.NODE_ENV || shared_constants_1.DEFAULT_NODE_ENV,
    PROWLARR_URL: process.env.PROWLARR_URL || "http://localhost:9696",
    PROWLARR_API_KEY: process.env.PROWLARR_API_KEY || ""
};
// Logs clean startup configuration summary (hiding credentials if present)
function logConfigSummary(logger) {
    const sanitizedRedis = exports.config.REDIS_URL.replace(/:[^:@]+@/, ":****@");
    const sanitizedApiKey = exports.config.PROWLARR_API_KEY
        ? `${exports.config.PROWLARR_API_KEY.slice(0, 4)}****`
        : "not configured";
    logger.info("Configuration loaded:");
    logger.info(`  - NODE_ENV: ${exports.config.NODE_ENV}`);
    logger.info(`  - PORT: ${exports.config.PORT}`);
    logger.info(`  - SQLITE_PATH: ${exports.config.SQLITE_PATH}`);
    logger.info(`  - REDIS_URL: ${sanitizedRedis}`);
    logger.info(`  - PROWLARR_URL: ${exports.config.PROWLARR_URL}`);
    logger.info(`  - PROWLARR_API_KEY: ${sanitizedApiKey}`);
}
//# sourceMappingURL=env.js.map