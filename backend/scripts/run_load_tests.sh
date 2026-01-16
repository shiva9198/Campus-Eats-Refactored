#!/bin/bash
# Comprehensive load testing script with phased approach
# Usage: ./run_load_tests.sh [phase]
# Phases: phase1 (50 users), phase2 (100 users), spike (200 users)

set -e

PHASE=${1:-phase1}
HOST=${2:-http://localhost:8000}

echo "🚀 Campus Eats Load Testing Suite"
echo "=================================="
echo "Phase: $PHASE"
echo "Host: $HOST"
echo ""

case $PHASE in
  phase1)
    echo "📊 Phase 1: 50 Users (Conservative Test)"
    echo "Target: <25% failure rate, <350ms login p95"
    locust -f tests/load_tests/locustfile.py \
      --config=tests/load_tests/locust.conf \
      --host=$HOST \
      --users 50 \
      --spawn-rate 5 \
      --run-time 3m \
      --headless \
      --html=tests/reports/load_test_phase1.html \
      --csv=tests/reports/load_test_phase1
    ;;
    
  phase2)
    echo "📊 Phase 2: 100 Users (Realistic Campus Load)"
    echo "Target: <10% failure rate, <250ms login p95"
    locust -f tests/load_tests/locustfile.py \
      --config=tests/load_tests/locust.conf \
      --host=$HOST \
      --users 100 \
      --spawn-rate 10 \
      --run-time 5m \
      --headless \
      --html=tests/reports/load_test_phase2.html \
      --csv=tests/reports/load_test_phase2
    ;;
    
  spike)
    echo "🔥 Spike Test: 200 Users (Lunch Rush Simulation)"
    echo "Simulates sudden traffic spike (lunch bell rings)"
    echo "Target: System stays responsive, no crashes"
    locust -f tests/load_tests/locustfile.py \
      --config=tests/load_tests/locust.conf \
      --host=$HOST \
      --users 200 \
      --spawn-rate 50 \
      --run-time 2m \
      --headless \
      --html=tests/reports/load_test_spike.html \
      --csv=tests/reports/load_test_spike
    ;;
    
  full)
    echo "🎯 Full Test Suite (All Phases)"
    echo "Running Phase 1, Phase 2, and Spike tests..."
    echo ""
    
    echo "⏳ Starting Phase 1..."
    $0 phase1 $HOST
    sleep 10
    
    echo ""
    echo "⏳ Starting Phase 2..."
    $0 phase2 $HOST
    sleep 10
    
    echo ""
    echo "⏳ Starting Spike Test..."
    $0 spike $HOST
    
    echo ""
    echo "✅ All tests complete! Check HTML reports."
    ;;
    
  *)
    echo "❌ Invalid phase: $PHASE"
    echo "Usage: $0 [phase1|phase2|spike|full] [host]"
    exit 1
    ;;
esac

echo ""
echo "✅ Test complete! Check the HTML report for detailed results."
