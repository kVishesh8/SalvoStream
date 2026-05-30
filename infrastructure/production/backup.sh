#!/bin/bash
# ==============================================================================
# SalvoStream - Stage 5 Production Backup Script
#
# Creates a compressed, dated tarball of critical persistent storage directories:
# - SalvoStream SQLite database (/opt/salvostream/data)
# - Prowlarr configuration and database (/opt/salvostream/prowlarr)
# - Redis volume state (/opt/salvostream/redis_data)
#
# Saves backups under /opt/salvostream/backups and retains the last 7 days.
# ==============================================================================

# Strict error handling: exit immediately on error, treat unset variables as error
set -euo pipefail

# Centralized paths
BASE_DIR="/opt/salvostream"
BACKUP_DIR="${BASE_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/salvostream_backup_${TIMESTAMP}.tar.gz"

echo "======================================================================"
echo "[$(date)] Starting SalvoStream Backup..."
echo "======================================================================"

# 1. Ensure the backup directory exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
fi

# 2. Check and compile active directories to backup
TARGETS=""
for dir in "data" "prowlarr" "redis_data"; do
    if [ -d "${BASE_DIR}/${dir}" ]; then
        TARGETS="${TARGETS} ${dir}"
    else
        echo "WARNING: Directory ${BASE_DIR}/${dir} not found. Skipping from backup."
    fi
done

if [ -z "${TARGETS}" ]; then
    echo "ERROR: No persistent data directories found in ${BASE_DIR}! Backup cancelled."
    exit 1
fi

# 3. Create the compressed tarball
echo "Archiving directories: ${TARGETS}..."
tar -czf "${BACKUP_FILE}" -C "${BASE_DIR}" ${TARGETS}

# 4. Confirm backup file size and creation
if [ -f "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
    echo "SUCCESS: Backup successfully created: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
else
    echo "ERROR: Failed to write backup tarball!"
    exit 1
fi

# 5. Clean up backups older than 7 days to preserve VPS disk space
echo "Cleaning up backups older than 7 days..."
find "${BACKUP_DIR}" -name "salvostream_backup_*.tar.gz" -type f -mtime +7 -print -delete

echo "======================================================================"
echo "[$(date)] Backup Completed Successfully!"
echo "======================================================================"
