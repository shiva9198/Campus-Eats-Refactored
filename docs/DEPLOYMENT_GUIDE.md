# 🚀 Campus Eats - Final Pre-Launch Deployment Guide

This guide covers the deployment of the 3 final production-critical features implemented before launch.

## ✅ What's New

1. **Sentry Error Monitoring** - Real-time error tracking for backend + mobile
2. **Automated Database Backups** - Daily PostgreSQL backups with retention
3. **Secure Payment Proofs** - Cloudinary private uploads with signed URLs

---

## 📋 Pre-Deployment Checklist

### 1. Sentry Setup (15 minutes)

#### Create Sentry Projects

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5K errors/month)
2. Create project: **"Campus Eats Backend"** (Platform: Python/FastAPI)
3. Create project: **"Campus Eats Mobile"** (Platform: React Native)
4. Copy both DSNs

#### Configure Backend

```bash
# Add to backend/.env
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
ENVIRONMENT=production
```

#### Configure Mobile

Edit `mobile/index.js`:
```javascript
const SENTRY_DSN = 'https://your-mobile-dsn@sentry.io/project-id';
```

#### Test Backend Sentry

```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# In another terminal, trigger test error
curl http://localhost:8000/test-sentry

# Check Sentry dashboard - error should appear within 30 seconds
```

#### Test Mobile Sentry

```javascript
// Add temporary test button in App.js (dev mode only)
if (__DEV__) {
  <Button 
    title="Test Sentry" 
    onPress={() => Sentry.captureException(new Error('Test mobile error'))}
  />
}
```

**⚠️ IMPORTANT:** Remove `/test-sentry` endpoint before production deploy!

---

### 2. Database Backups Setup (20 minutes)

#### Create Backup Directory

```bash
sudo mkdir -p /var/backups/campus-eats
sudo chown $USER:$USER /var/backups/campus-eats
chmod 700 /var/backups/campus-eats
```

#### Configure PostgreSQL Authentication

**Option A: Using .pgpass (Recommended)**

```bash
# Create ~/.pgpass
echo "localhost:5432:campus_eats:postgres:YOUR_PASSWORD" >> ~/.pgpass
chmod 600 ~/.pgpass
```

**Option B: Environment Variable**

```bash
# Add to backend/.env
PGPASSWORD=your_postgres_password
```

#### Test Manual Backup

```bash
cd /path/to/Campus-Eats-Clone
./backend/scripts/backup_database.sh

# Verify backup created
ls -lh /var/backups/campus-eats/
cat /var/backups/campus-eats/backup.log
```

#### Setup Cron Job (Daily at 2 AM)

```bash
crontab -e

# Add this line (adjust path to your installation):
0 2 * * * PGPASSWORD="your_password" /full/path/to/backend/scripts/backup_database.sh >> /var/backups/campus-eats/cron.log 2>&1
```

#### Test Restore (on test database)

```bash
# Create test database
createdb campus_eats_test

# Restore latest backup to test DB
export DB_NAME=campus_eats_test
./backend/scripts/restore_database.sh /var/backups/campus-eats/campus_eats_*.sql.gz

# Verify data
psql -d campus_eats_test -c "SELECT COUNT(*) FROM orders;"

# Cleanup
dropdb campus_eats_test
```

---

### 3. Cloudinary Setup (15 minutes)

#### Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25 credits/month)
2. Go to Dashboard → Settings → Security
3. **CRITICAL:** Set "Resource access control" to **"Private"**
4. Copy credentials: Cloud Name, API Key, API Secret

#### Configure Backend

```bash
# Add to backend/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Test Upload Flow

```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Check startup logs - should see:
# ✅ Cloudinary: Configured (Secure payment proofs enabled)
```

**Test with curl:**

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass" | jq -r '.access_token')

# 2. Create test order (get order_id from response)
ORDER_ID=1

# 3. Upload payment proof
curl -X POST "http://localhost:8000/payments/upload-proof?order_id=$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test-image.jpg"

# 4. Get signed URL
curl "http://localhost:8000/payments/$ORDER_ID/payment-proof" \
  -H "Authorization: Bearer $TOKEN"

# 5. Verify URL works (copy URL from response and open in browser)
# 6. Wait 6 minutes and verify URL expired
```

#### Verify Cloudinary Dashboard

1. Go to Cloudinary Console → Media Library
2. Navigate to `payment_proofs/` folder
3. Try to access image directly → Should fail (private)
4. Verify image metadata shows `type: private`

---

## 🔒 Security Verification

### Backend Security Checks

```bash
# 1. Verify .env not in git
git status | grep .env  # Should show nothing

# 2. Check Sentry not logging sensitive data
# Trigger error with auth token, check Sentry dashboard
# Verify token is NOT visible in error details

# 3. Verify Cloudinary uploads are private
# Try accessing: https://res.cloudinary.com/YOUR_CLOUD/image/upload/payment_proofs/order_1_user_1.jpg
# Should return 404 or access denied
```

### Mobile Security Checks

```bash
# 1. Verify Sentry DSN not hardcoded in production
grep -r "sentry.io" mobile/  # Should only be in index.js

# 2. Check APK size
ls -lh mobile/android/app/build/outputs/apk/release/
# Should be < 20 MB
```

---

## 📊 Monitoring Setup

### Sentry Alerts

1. Go to Sentry → Alerts → Create Alert Rule
2. Set conditions:
   - **Backend:** Trigger when error count > 10 in 1 hour
   - **Mobile:** Trigger when crash rate > 1% of sessions
3. Configure notifications (Email/Slack)

### Backup Monitoring

```bash
# Add to crontab (check backups daily at 3 AM)
0 3 * * * /path/to/check_backup.sh

# Create check_backup.sh:
#!/bin/bash
LATEST_BACKUP=$(ls -t /var/backups/campus-eats/campus_eats_*.sql.gz | head -1)
BACKUP_AGE=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP")) / 3600 ))

if [ $BACKUP_AGE -gt 30 ]; then
  echo "WARNING: Latest backup is $BACKUP_AGE hours old!" | mail -s "Backup Alert" admin@example.com
fi
```

---

## 🚀 Deployment Steps

### 1. Update Production Environment

```bash
# SSH to production server
ssh user@your-server.com

# Pull latest code
cd /path/to/Campus-Eats-Clone
git pull origin main

# Update backend dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Verify environment variables
cat .env  # Check all new variables are set
```

### 2. Restart Backend

```bash
# If using systemd
sudo systemctl restart campus-eats-backend

# If using screen/tmux
pkill -f uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

# Verify startup logs
tail -f /var/log/campus-eats/backend.log
# Should see:
# ✅ Redis: Connected
# ✅ Cloudinary: Configured
# ✅ Sentry initialized (if DSN set)
```

### 3. Deploy Mobile App

```bash
cd mobile

# Update Sentry DSN in index.js
# Build release APK
npm run android:release

# Verify APK size
ls -lh android/app/build/outputs/apk/release/app-release.apk
# Should be < 20 MB

# Distribute APK
```

---

## ✅ Post-Deployment Verification

### Immediate Checks (First 10 minutes)

- [ ] Backend starts without errors
- [ ] Sentry shows backend as "online" in dashboard
- [ ] Test order creation works
- [ ] Test payment proof upload works
- [ ] Signed URL generation works
- [ ] Signed URL expires after 5 minutes
- [ ] Mobile app connects to backend
- [ ] Mobile Sentry shows app as "online"

### First Hour Checks

- [ ] No errors in Sentry dashboard
- [ ] Backend logs look normal
- [ ] Redis connection stable
- [ ] Cloudinary upload count < 25 (free tier limit)

### First Day Checks

- [ ] Backup created at 2 AM (check `/var/backups/campus-eats/`)
- [ ] Backup log shows success
- [ ] No critical errors in Sentry
- [ ] Payment proof uploads working for real users

---

## 🔄 Rollback Plan

If any feature causes issues:

### Rollback Sentry

```bash
# Backend: Comment out Sentry init in main.py
# Mobile: Set SENTRY_DSN = '' in index.js
# Restart services
```

### Rollback Cloudinary

```bash
# Remove upload endpoints from payments.py
# Keep existing UTR-only flow
# No database changes needed
```

### Rollback Backups

```bash
# Simply disable cron job
crontab -e  # Comment out backup line
# No runtime impact
```

---

## 📈 Success Metrics

### Week 1 Targets

- **Sentry:** < 50 errors/day
- **Backups:** 7 successful backups
- **Cloudinary:** < 100 uploads (well within free tier)
- **APK Size:** < 16 MB
- **Uptime:** > 99%

### Week 2 Review

- Analyze Sentry error patterns
- Test backup restore on staging
- Review Cloudinary usage
- Optimize if needed

---

## 🆘 Troubleshooting

### Sentry Not Receiving Errors

```bash
# Check DSN is set
echo $SENTRY_DSN

# Test with curl
curl -X POST http://localhost:8000/test-sentry

# Check Sentry project settings → Client Keys
```

### Backup Failing

```bash
# Check cron logs
cat /var/backups/campus-eats/cron.log

# Test pg_dump manually
pg_dump -U postgres -d campus_eats > test.sql

# Check .pgpass permissions
ls -la ~/.pgpass  # Should be 600
```

### Cloudinary Upload Failing

```bash
# Check credentials
python3 << EOF
from cloudinary_config import init_cloudinary
print(init_cloudinary())
EOF

# Check Cloudinary dashboard → Usage
# Verify not over quota
```

---

## 📞 Support

- **Sentry Issues:** [docs.sentry.io](https://docs.sentry.io)
- **Cloudinary Issues:** [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **PostgreSQL Backups:** [postgresql.org/docs/current/backup.html](https://www.postgresql.org/docs/current/backup.html)

---

## 🎯 Final Checklist Before Launch

- [ ] Sentry receiving test errors (backend + mobile)
- [ ] Database backup created and verified
- [ ] Cloudinary uploads working with signed URLs
- [ ] All environment variables set in production
- [ ] APK size < 20 MB
- [ ] `/test-sentry` endpoint removed
- [ ] Backup cron job scheduled
- [ ] Sentry alerts configured
- [ ] Team has access to Sentry dashboard
- [ ] Backup restore tested on staging

**If all checked: 🟢 GO FOR LAUNCH**

---

*Last updated: 2026-01-13*
