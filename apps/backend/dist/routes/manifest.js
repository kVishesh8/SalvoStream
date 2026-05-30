"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_constants_1 = require("@salvostream/shared-constants");
const manifestRoutes = async (fastify) => {
    const manifest = {
        id: shared_constants_1.ADDON_ID,
        name: shared_constants_1.ADDON_NAME,
        version: shared_constants_1.ADDON_VERSION,
        description: shared_constants_1.ADDON_DESCRIPTION,
        resources: Array.from(shared_constants_1.STREMIO_RESOURCES),
        types: Array.from(shared_constants_1.STREMIO_TYPES),
        idPrefixes: [shared_constants_1.ADDON_ID, "tt"] // standard movie/series imdb prefix "tt" is essential for Stremio matching
    };
    // Serve Stremio manifest.json
    fastify.get("/manifest.json", async (request, reply) => {
        // Add standard CORS headers for Stremio installations
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Headers", "*");
        reply.header("Content-Type", "application/json; charset=utf-8");
        return manifest;
    });
};
exports.default = manifestRoutes;
//# sourceMappingURL=manifest.js.map