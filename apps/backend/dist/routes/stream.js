"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_js_1 = require("../prowlarr/client.js");
const metadata_js_1 = require("../prowlarr/metadata.js");
const processor_js_1 = require("../prowlarr/processor.js");
const streamRoutes = async (fastify) => {
    // Stremio streams lookup endpoint: GET /stream/:type/:id.json
    // Fastify route matches GET /stream/:type/:id (which handles both id and id.json)
    fastify.get("/stream/:type/:id", async (request, reply) => {
        // CORS headers are critical for Stremio cross-origin client players
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Headers", "*");
        reply.header("Content-Type", "application/json; charset=utf-8");
        const { type, id } = request.params;
        // Clean the id by stripping .json if present
        const cleanId = id.endsWith(".json") ? id.slice(0, -5) : id;
        // [DEBUG] 1. Incoming stream request
        request.log.info({ type, cleanId }, "[DEBUG] 1. Incoming stream request received");
        // Validate resource type - Stage 2 only supports movies and series
        if (type !== "movie" && type !== "series") {
            request.log.warn({ type }, "Unsupported media type requested");
            return { streams: [] };
        }
        try {
            // 1. Initialize Prowlarr client
            const prowlarr = new client_js_1.ProwlarrClient(request.log);
            // 2. Parse request ID (splitting series seasons/episodes)
            const parsedId = (0, metadata_js_1.parseStremioId)(cleanId, type);
            // [DEBUG] 2. Cinemeta request start
            request.log.info({ imdbId: parsedId.imdbId, type }, "[DEBUG] 2. Cinemeta request start");
            // 3. Resolve Media Title and Year from Cinemeta (with caching)
            const metadata = await (0, metadata_js_1.fetchMetadata)(type, parsedId.imdbId, request.log);
            // [DEBUG] 2. Cinemeta request end
            request.log.info({ metadataResolved: !!metadata }, "[DEBUG] 2. Cinemeta request end");
            // 4. Generate the search query string (e.g. "Fight Club 1999" or "Game of Thrones S01E01")
            const searchQuery = (0, metadata_js_1.buildSearchQuery)(parsedId, metadata);
            request.log.info({ searchQuery, cleanId }, "Generated search query for torrent search");
            // [DEBUG] 3. Prowlarr request start
            request.log.info({ searchQuery, type }, "[DEBUG] 3. Prowlarr request start");
            // 5. Query Prowlarr search API
            const rawResults = await prowlarr.search(searchQuery, type);
            // [DEBUG] 3. Prowlarr request end
            request.log.info({ rawResultsCount: rawResults.length }, "[DEBUG] 3. Prowlarr request end");
            // [DEBUG] 4. Torrent parsing start
            request.log.info({ rawResultsCount: rawResults.length }, "[DEBUG] 4. Torrent parsing start");
            // 6. Process, filter (seeds > 0, keyword blacklist), sort, and deduplicate results
            const renderedStreams = (0, processor_js_1.processAndRenderStreams)(rawResults, request.log);
            // [DEBUG] 4. Torrent parsing end
            request.log.info({ renderedCount: renderedStreams.length }, "[DEBUG] 4. Torrent parsing end");
            // [DEBUG] 5. Stream rendering start
            request.log.info({ streamsCount: renderedStreams.length }, "[DEBUG] 5. Stream rendering start");
            const response = {
                streams: renderedStreams
            };
            // [DEBUG] 5. Stream rendering end
            request.log.info({}, "[DEBUG] 5. Stream rendering end");
            // [DEBUG] 6. Final response send
            request.log.info({ streamsCount: response.streams.length }, "[DEBUG] 6. Final response send");
            return response;
        }
        catch (err) {
            request.log.error({ error: err.message, cleanId }, "Failed to process stream lookup request");
            // Safe fallback - return empty streams array, never crash
            return { streams: [] };
        }
    });
};
exports.default = streamRoutes;
//# sourceMappingURL=stream.js.map