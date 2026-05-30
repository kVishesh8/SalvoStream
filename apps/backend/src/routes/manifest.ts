import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { StremioManifest } from "@salvostream/shared-types";
import {
  ADDON_ID,
  ADDON_NAME,
  ADDON_VERSION,
  ADDON_DESCRIPTION,
  STREMIO_RESOURCES,
  STREMIO_TYPES
} from "@salvostream/shared-constants";

const manifestRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const manifest: StremioManifest = {
    id: ADDON_ID,
    name: ADDON_NAME,
    version: ADDON_VERSION,
    description: ADDON_DESCRIPTION,
    resources: Array.from(STREMIO_RESOURCES) as any,
    types: Array.from(STREMIO_TYPES) as any,
    idPrefixes: [ADDON_ID, "tt"] // standard movie/series imdb prefix "tt" is essential for Stremio matching
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

export default manifestRoutes;
