# Stage 1: Build the application
FROM node:22-alpine AS builder

# Install build tools for native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Copy workspaces configurations
COPY package.json tsconfig.json eslint.config.js ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-constants/package.json ./packages/shared-constants/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install all dependencies (including dev dependencies to compile TypeScript)
RUN npm install

# Copy all source files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-constants/src ./packages/shared-constants/src
COPY packages/shared-constants/tsconfig.json ./packages/shared-constants/
COPY packages/shared-utils/src ./packages/shared-utils/src
COPY packages/shared-utils/tsconfig.json ./packages/shared-utils/

# Build all workspaces
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS runner

# Install runtime libraries
RUN apk add --no-cache sqlite-libs

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_PATH=/app/data/salvostream.db
ENV REDIS_URL=redis://redis:6379

# Copy package configurations for workspaces
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-constants/package.json ./packages/shared-constants/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install only production dependencies (requires compilation tools temporarily for better-sqlite3 build)
RUN apk add --no-cache python3 make g++ sqlite-dev && \
    npm install --omit=dev && \
    apk del python3 make g++ sqlite-dev

# Copy compiled TypeScript outputs from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-constants/dist ./packages/shared-constants/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist

# Ensure the database directory exists and has correct permissions
RUN mkdir -p /app/data

# Expose backend service port
EXPOSE 3000

# Start the service
CMD ["npm", "start", "-w", "@salvostream/backend"]
