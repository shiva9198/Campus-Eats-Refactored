# 🚀 Quick Start - Load Test Performance Verification

## Prerequisites

### 1. Run Pre-Test Checklist
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/backend

# Verify all prerequisites
./scripts/pre_test_checklist.sh
```

This checks:
- ✅ Backend server is running
- ✅ Database is accessible
- ✅ Required indexes exist
- ✅ Locust is installed
- ✅ Test users are seeded
- ✅ Ports are available

### 2. Add Order Indexes (First Time Only)
```bash
# Add performance indexes for order queries
psql -U shiva -d campuseats -f scripts/add_order_indexes.sql
```

### 3. Ensure Backend is Running
```bash
./start_server.sh
```

---

## 1️⃣ Test Login Performance (30 seconds)

```bash
python3 scripts/test_login_performance.py
```

**Expected:** p95 < 350ms (was 440ms)

---

## 2️⃣ Run Phase 1 Load Test (3 minutes)

```bash
./scripts/run_load_tests.sh phase1
```

**Targets:**
- ✅ Failure Rate: <25% (was 59.92%)
- ✅ 503 Errors: <10% (was 17%)
- ✅ 429 Errors: <15% (was 23%)

**Review Results:**
```bash
open load_test_phase1.html
```

---

## 3️⃣ Monitor Database (During Tests)

```bash
# In separate terminal
./scripts/monitor_db_connections.sh
```

**Watch:** Total connections should stay <50

---

## 4️⃣ If Phase 1 Passes → Phase 2 (5 minutes)

```bash
./scripts/run_load_tests.sh phase2
```

**Target:** <10% failure rate with 100 users

---

## 5️⃣ Spike Test - Lunch Rush (2 minutes)

```bash
./scripts/run_load_tests.sh spike
```

**Purpose:** 200 users @ 50/sec spawn (sudden burst)

---

## 📊 Quick Results Summary

After each test, check:
```bash
# View HTML report
open load_test_phase*.html

# Or check CSV stats
cat load_test_phase*_stats.csv | column -t -s,
```

**Key Metrics:**
- Overall failure %
- Response time p95/p99
- Requests per second
- Error breakdown (400/429/503)

---

## 🔄 Full Test Suite

Run all tests sequentially:
```bash
./scripts/run_load_tests.sh full
```

This runs: Phase 1 → Phase 2 → Spike Test

---

## 🎯 Success Criteria

### Week 1 (Immediate)
- [ ] Failure Rate: <25%
- [ ] Login p95: <350ms
- [ ] 503 Errors: <10%

### Week 2 (Optimization)
- [ ] Failure Rate: <10%
- [ ] Login p95: <250ms

### Week 3 (Stretch)
- [ ] Failure Rate: <5%
- [ ] Login p95: <200ms
- [ ] 150+ concurrent users
