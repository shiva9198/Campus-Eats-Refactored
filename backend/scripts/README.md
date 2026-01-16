# Campus Eats Database Backup Configuration

This directory contains scripts for automated database backups and restoration.

## Scripts

### `backup_database.sh`
Automated backup script that:
- Creates compressed PostgreSQL dumps
- Maintains retention policy (default: 7 days)
- Logs all operations
- Supports cloud upload (optional)

### `restore_database.sh`
Safe restoration script that:
- Prevents accidental production restores
- Terminates existing connections
- Recreates database from backup
- Verifies restoration

## Setup

### 1. Make scripts executable
```bash
chmod +x backend/scripts/backup_database.sh
chmod +x backend/scripts/restore_database.sh
```

### 2. Configure PostgreSQL authentication

**Option A: Using .pgpass (Recommended)**
```bash
# Create ~/.pgpass file
echo "localhost:5432:campus_eats:postgres:your_password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

**Option B: Using environment variable**
```bash
export PGPASSWORD="your_password"
```

### 3. Create backup directory
```bash
sudo mkdir -p /var/backups/campus-eats
sudo chown $USER:$USER /var/backups/campus-eats
chmod 700 /var/backups/campus-eats
```

### 4. Test manual backup
```bash
./backend/scripts/backup_database.sh
```

### 5. Setup cron job (daily at 2 AM)
```bash
crontab -e

# Add this line:
0 2 * * * PGPASSWORD="your_password" /path/to/backend/scripts/backup_database.sh >> /var/backups/campus-eats/cron.log 2>&1
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/var/backups/campus-eats` | Backup storage location |
| `DB_NAME` | `campus_eats` | Database name |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `RETENTION_DAYS` | `7` | Days to keep backups |
| `PGPASSWORD` | - | PostgreSQL password |
| `ENVIRONMENT` | `development` | Environment (production blocks restore) |

## Usage

### Manual Backup
```bash
./backend/scripts/backup_database.sh
```

### List Backups
```bash
ls -lh /var/backups/campus-eats/
```

### Restore from Backup
```bash
# On development/staging only
./backend/scripts/restore_database.sh /var/backups/campus-eats/campus_eats_20260113_140000.sql.gz
```

### View Backup Logs
```bash
tail -f /var/backups/campus-eats/backup.log
```

## Cloud Storage (Optional)

To enable automatic cloud uploads, install rclone and configure:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive
rclone config

# Uncomment cloud upload section in backup_database.sh
```

## Verification

After setting up cron:
1. Wait for next scheduled run (or trigger manually)
2. Check backup file created: `ls -lh /var/backups/campus-eats/`
3. Check logs: `cat /var/backups/campus-eats/backup.log`
4. Test restore on local copy

## Security Notes

- Backup directory permissions: `700` (owner only)
- `.pgpass` file permissions: `600` (owner read/write only)
- Never commit passwords to git
- Production restore is blocked by default
- Backups contain sensitive data - encrypt if storing remotely
