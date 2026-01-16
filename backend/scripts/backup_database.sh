#!/bin/bash

# Campus Eats Database Backup Script
# Runs daily via cron

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/campus-eats}"
DB_NAME="${DB_NAME:-campuseats}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/campus_eats_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Log start
echo "[$(date)] Starting database backup..." >> "${LOG_FILE}"

# Perform backup with compression
# Using PGPASSWORD environment variable for authentication (set in cron or .pgpass)
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_FILE}"

# Verify backup file created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] ✅ Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})" >> "${LOG_FILE}"
else
    echo "[$(date)] ❌ ERROR: Backup file not created!" >> "${LOG_FILE}"
    exit 1
fi

# Delete backups older than retention period
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "campus_eats_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED_COUNT}" -gt 0 ]; then
    echo "[$(date)] 🗑️  Deleted ${DELETED_COUNT} backup(s) older than ${RETENTION_DAYS} days" >> "${LOG_FILE}"
fi

# Optional: Upload to cloud storage (Google Drive, S3, etc.)
# Uncomment and configure as needed:
# if command -v rclone &> /dev/null; then
#     rclone copy "${BACKUP_FILE}" gdrive:campus-eats-backups/
#     echo "[$(date)] ☁️  Uploaded to cloud storage" >> "${LOG_FILE}"
# fi

echo "[$(date)] ✅ Backup process completed successfully" >> "${LOG_FILE}"
echo "" >> "${LOG_FILE}"
