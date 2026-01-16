#!/bin/bash
# Quick deployment script for multi-worker setup
# File: backend/deploy_multiworker.sh

set -e

echo "🚀 Multi-Worker Deployment Script"
echo "=================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Step 1: Stop single-worker server
echo "📍 Step 1: Stopping single-worker Uvicorn..."
pkill -f uvicorn || echo "   No Uvicorn process found (OK)"
sleep 2

# Step 2: Verify Gunicorn is installed
echo ""
echo "📍 Step 2: Verifying Gunicorn installation..."
source venv/bin/activate
if ! pip show gunicorn > /dev/null 2>&1; then
    echo "   Installing Gunicorn..."
    pip install gunicorn
else
    echo "   ✅ Gunicorn already installed"
fi

# Step 3: Create logs directory
echo ""
echo "📍 Step 3: Creating logs directory..."
mkdir -p logs
echo "   ✅ Logs directory ready"

# Step 4: Start multi-worker server
echo ""
echo "📍 Step 4: Starting multi-worker Gunicorn server..."
echo "   Press Ctrl+C to stop the server"
echo ""

./start_production.sh
