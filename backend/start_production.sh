#!/bin/bash
# Production Deployment Script for Campus Eats
# Uses Gunicorn with multiple Uvicorn workers

set -e

echo "🚀 Starting Campus Eats Backend (Production Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install Gunicorn if not already installed
if ! pip show gunicorn > /dev/null 2>&1; then
    echo "📦 Installing Gunicorn..."
    pip install gunicorn
fi

# Calculate optimal worker count
# Formula: (2 x CPU cores) + 1
if command -v nproc > /dev/null 2>&1; then
    CPU_CORES=$(nproc)
elif command -v sysctl > /dev/null 2>&1; then
    CPU_CORES=$(sysctl -n hw.ncpu)
else
    CPU_CORES=4  # Default fallback
fi

WORKERS=$((2 * CPU_CORES + 1))

echo "CPU Cores: $CPU_CORES"
echo "Workers: $WORKERS"
echo "Worker Class: uvicorn.workers.UvicornWorker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Gunicorn with Uvicorn workers
gunicorn main:app \
    --workers $WORKERS \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --log-level info \
    --preload \
    --max-requests 1000 \
    --max-requests-jitter 50

# Explanation of flags:
# --workers: Number of worker processes (handles concurrent requests)
# --worker-class: Use Uvicorn workers (async support)
# --bind: Listen on all interfaces, port 8000
# --timeout: Request timeout (2 minutes for slow auth)
# --keep-alive: Keep connections alive for 5 seconds
# --access-logfile: Log all requests
# --error-logfile: Log errors
# --preload: Load app before forking (faster startup)
# --max-requests: Restart worker after 1000 requests (prevent memory leaks)
# --max-requests-jitter: Add randomness to prevent all workers restarting at once
