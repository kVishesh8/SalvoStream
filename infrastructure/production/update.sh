#!/bin/bash
# ==============================================================================
# SalvoStream - Stage 5 Production Manual Update Script
#
# Pulls the latest code from the git repository, rebuilds the Docker images,
# and restarts the container stack.
# ==============================================================================

# Strict error handling: exit immediately on error, treat unset variables as error
set -euo pipefail

# Centralized paths
BASE_DIR="/opt/salvostream"
COMPOSE_FILE="${BASE_DIR}/infrastructure/production/docker-compose.prod.yml"

echo "======================================================================"
echo "[$(date)] Initiating SalvoStream Update..."
echo "======================================================================"

# 1. Navigate to the centralized installation directory
cd "${BASE_DIR}"

# 2. Pull the latest commits from the active branch
echo "Pulling latest code from Git..."
git pull

# 3. Rebuild and restart the container stack using the production compose file
echo "Rebuilding and restarting Docker containers..."
docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

# 4. Prune old images and build caches to prevent filling the VPS disk space
echo "Pruning dangling Docker images and build cache..."
docker image prune -f

echo "======================================================================"
echo "[$(date)] SalvoStream Updated & Started Successfully!"
echo "======================================================================"
