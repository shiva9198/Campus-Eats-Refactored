#!/bin/bash
# Pre-test verification checklist
# Ensures all prerequisites are met before running load tests
# Usage: ./scripts/pre_test_checklist.sh

echo "🔧 Pre-Test Verification Checklist"
echo "===================================="
echo ""

ERRORS=0

# Check 1: Backend is running
echo -n "✓ Backend server... "
if curl -s http://localhost:8000/health/ > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ NOT RUNNING"
    echo "   Start with: ./start_server.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Database is accessible
echo -n "✓ Database connection... "
if psql -U shiva -d campuseats -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ NOT ACCESSIBLE"
    echo "   Check PostgreSQL is running"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Required indexes exist
echo -n "✓ Database indexes... "
INDEX_COUNT=$(psql -U shiva -d campuseats -t -c "
    SELECT count(*) FROM pg_indexes 
    WHERE indexname IN ('ix_users_email', 'idx_orders_user_id', 'idx_orders_status');
" 2>/dev/null | tr -d ' ')

if [ "$INDEX_COUNT" -eq "3" ]; then
    echo "✅ All present ($INDEX_COUNT/3)"
elif [ "$INDEX_COUNT" -eq "1" ]; then
    echo "⚠️  Missing order indexes (found $INDEX_COUNT/3)"
    echo "   Run: psql -U shiva -d campuseats -f scripts/add_order_indexes.sql"
else
    echo "❌ Missing indexes (found $INDEX_COUNT/3)"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Locust is installed
echo -n "✓ Locust installed... "
if command -v locust &> /dev/null; then
    VERSION=$(locust --version 2>&1 | head -n1)
    echo "✅ $VERSION"
else
    echo "❌ NOT INSTALLED"
    echo "   Install with: pip install locust"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Test users exist
echo -n "✓ Test users... "
USER_COUNT=$(psql -U shiva -d campuseats -t -c "
    SELECT count(*) FROM users WHERE username LIKE 'loadtest%';
" 2>/dev/null | tr -d ' ')

if [ "$USER_COUNT" -ge "10" ]; then
    echo "✅ Found $USER_COUNT test users"
elif [ "$USER_COUNT" -gt "0" ]; then
    echo "⚠️  Only $USER_COUNT test users (recommend 100+)"
    echo "   Run: python3 scripts/seed_load_test_users.py"
else
    echo "❌ No test users found"
    echo "   Create with: python3 scripts/seed_load_test_users.py"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Locust port availability
echo -n "✓ Locust port (8089)... "
if lsof -i :8089 > /dev/null 2>&1; then
    echo "⚠️  Port in use"
    echo "   Kill previous Locust: lsof -ti:8089 | xargs kill"
else
    echo "✅ Available"
fi

# Check 7: Redis is running (optional but recommended)
echo -n "✓ Redis server... "
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Not running (optional, but caching will be disabled)"
fi

# Check 8: Disk space
echo -n "✓ Disk space... "
DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}')
echo "✅ $DISK_AVAIL available"

echo ""
echo "===================================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ System Ready for Load Testing"
    echo "===================================="
    echo ""
    echo "Run tests with:"
    echo "  ./scripts/run_load_tests.sh phase1"
    echo ""
    echo "Monitor during tests:"
    echo "  ./scripts/monitor_load_test.sh"
    echo ""
    exit 0
else
    echo "❌ $ERRORS Critical Issues Found"
    echo "===================================="
    echo ""
    echo "Fix the issues above before running load tests."
    echo ""
    exit 1
fi
