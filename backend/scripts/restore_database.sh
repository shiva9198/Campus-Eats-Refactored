#!/bin/bash

# Campus Eats Database Restore Script
# Usage: ./restore_database.sh <backup_file.sql.gz>

set -e

# Configuration
DB_NAME="${DB_NAME:-campus_eats}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
ENVIRONMENT="${ENVIRONMENT:-development}"

# SAFETY: Prevent accidental restore on production
if [ "$ENVIRONMENT" = "production" ]; then
    echo "❌ ERROR: Refusing to restore on production environment"
    echo "To restore on production, unset ENVIRONMENT variable or set it to 'staging'"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: ./restore_database.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    if [ -d "/var/backups/campus-eats" ]; then
        ls -lh /var/backups/campus-eats/campus_eats_*.sql.gz 2>/dev/null || echo "No backups found"
    else
        echo "Backup directory not found"
    fi
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database: $DB_NAME"
echo "Environment: $ENVIRONMENT"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you absolutely sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Restoring from ${BACKUP_FILE}..."

# Terminate existing connections to the database
echo "Terminating existing connections..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

# Drop existing database and recreate
echo "Dropping and recreating database..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
echo "Restoring data..."
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "Verification:"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "\dt" 2>/dev/null || echo "Could not list tables"
