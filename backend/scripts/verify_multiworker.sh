#!/bin/bash
# Verify multi-worker deployment
# File: backend/scripts/verify_multiworker.sh

set -e

echo "🔍 Multi-Worker Deployment Verification"
echo "========================================"
echo ""

# Check 1: Worker processes
echo "📍 Check 1: Worker Processes"
WORKER_COUNT=$(ps aux | grep gunicorn | grep -v grep | wc -l | tr -d ' ')
echo "   Workers running: $WORKER_COUNT"

if [ "$WORKER_COUNT" -eq 0 ]; then
    echo "   ❌ FAIL: No Gunicorn workers found"
    echo "   Action: Run ./deploy_multiworker.sh"
    exit 1
elif [ "$WORKER_COUNT" -lt 5 ]; then
    echo "   ⚠️  WARNING: Low worker count (expected 9 on 4-core CPU)"
else
    echo "   ✅ PASS: Multiple workers detected"
fi

echo ""

# Check 2: Health endpoint
echo "📍 Check 2: Health Endpoint"
if curl -s http://localhost:8000/health/ > /dev/null 2>&1; then
    echo "   ✅ PASS: Server responding"
else
    echo "   ❌ FAIL: Server not responding"
    exit 1
fi

echo ""

# Check 3: Worker details
echo "📍 Check 3: Worker Details"
echo "   Process listing:"
ps aux | grep gunicorn | grep -v grep | awk '{print "   - PID: " $2 " | CPU: " $3 "% | MEM: " $4 "% | CMD: " $11 " " $12 " " $13}'

echo ""

# Check 4: Port binding
echo "📍 Check 4: Port Binding"
if lsof -i :8000 > /dev/null 2>&1; then
    echo "   ✅ PASS: Port 8000 is bound"
    lsof -i :8000 | grep LISTEN | awk '{print "   - " $1 " (PID: " $2 ")"}'
else
    echo "   ❌ FAIL: Port 8000 not bound"
    exit 1
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Multi-Worker Deployment Verified"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. Run load tests: ./scripts/run_load_tests.sh phase2"
echo "2. Monitor workers: watch -n 2 'ps aux | grep gunicorn | grep -v grep'"
echo "3. View logs: tail -f logs/error.log"
echo ""
