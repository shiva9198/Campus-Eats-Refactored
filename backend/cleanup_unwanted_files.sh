#!/bin/bash
# Comprehensive cleanup script for Campus Eats backend
# Removes unwanted files AND redundant scripts

set -e

echo "🧹 Campus Eats Backend - Complete Cleanup"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Track space saved
INITIAL_SIZE=$(du -sk . | cut -f1)

# PART 1: Temporary Files
echo "📦 PART 1: Removing Temporary Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Python cache
echo "🗑️  Removing Python cache files..."
CACHE_COUNT=$(find . -type d -name "__pycache__" 2>/dev/null | wc -l | tr -d ' ')
echo "   Found $CACHE_COUNT __pycache__ directories"
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
echo "   ✅ Python cache cleaned"
echo ""

# Old test reports
echo "🗑️  Removing old test reports..."
echo "   Keeping: load_test_phase2.html, load_test_spike.html"
rm -f tests/load_tests/load_test_*.html 2>/dev/null || true
rm -f tests/load_tests/load_test_*.csv 2>/dev/null || true
rm -f tests/reports/load_test_phase1*.html 2>/dev/null || true
rm -f tests/reports/load_test_phase1*.csv 2>/dev/null || true
echo "   ✅ Old test reports removed"
echo ""

# Archive logs
echo "📦 Archiving log files..."
mkdir -p logs/archive
if [ -f logs/access.log ]; then
    mv logs/access.log logs/archive/access_$(date +%Y%m%d_%H%M%S).log
    echo "   ✅ Archived access.log"
fi
if [ -f logs/error.log ]; then
    mv logs/error.log logs/archive/error_$(date +%Y%m%d_%H%M%S).log
    echo "   ✅ Archived error.log"
fi
echo ""

# PID file
echo "🗑️  Checking PID file..."
if [ -f gunicorn.pid ]; then
    PID=$(cat gunicorn.pid 2>/dev/null || echo "")
    if [ -n "$PID" ] && ps -p $PID > /dev/null 2>&1; then
        echo "   ⚠️  Server running (PID: $PID) - keeping gunicorn.pid"
    else
        rm -f gunicorn.pid
        echo "   ✅ Removed stale gunicorn.pid"
    fi
else
    echo "   ℹ️  No PID file found"
fi
echo ""

# Outdated docs
echo "🗑️  Removing outdated documentation..."
rm -f tests/load_tests/LOAD_TEST_OPTIMIZATIONS_COMPLETE.md 2>/dev/null || true
echo "   ✅ Outdated docs removed"
echo ""

# PART 2: Redundant Scripts
echo "📦 PART 2: Removing Redundant Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🗑️  Removing verification scripts (replaced by pytest)..."
cd scripts
rm -f verify_endpoints_custom.py
rm -f verify_production.py
rm -f verify_scenarios.py
rm -f verify_system.py
rm -f test_login_performance.py
echo "   ✅ Removed 5 verification scripts"
echo ""

echo "🗑️  Removing monitoring scripts (simple one-liners)..."
rm -f monitor_load_test.sh
rm -f monitor_db_connections.sh
echo "   ✅ Removed 2 monitoring scripts"
echo ""

cd ..

# Calculate space saved
FINAL_SIZE=$(du -sk . | cut -f1)
SPACE_SAVED=$((INITIAL_SIZE - FINAL_SIZE))
SPACE_SAVED_MB=$(echo "scale=2; $SPACE_SAVED / 1024" | bc)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Complete Cleanup Finished!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Space saved: ${SPACE_SAVED_MB} MB"
echo ""
echo "📋 Summary:"
echo "  ✅ Python cache files: Removed"
echo "  ✅ Old test reports: Removed"
echo "  ✅ Logs: Archived to logs/archive/"
echo "  ✅ Redundant scripts: Removed (7 scripts)"
echo ""
echo "📁 Preserved:"
echo "  - Latest test results (Phase 2 & Spike)"
echo "  - Essential scripts (8 remaining)"
echo "  - All source code"
echo ""
echo "📊 Scripts remaining:"
ls -1 scripts/*.sh scripts/*.py scripts/*.sql 2>/dev/null | wc -l | xargs echo "  Total:"
echo ""
