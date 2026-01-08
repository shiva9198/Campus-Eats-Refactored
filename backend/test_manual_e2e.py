"""
Simplified E2E Real-Time Flow Test
Manual test procedure with step-by-step verification
"""
import subprocess
import time

def log(msg):
    print(f"\n{'='*60}\n{msg}\n{'='*60}")

log("END-TO-END REAL-TIME FLOW TEST - MANUAL PROCEDURE")

print("""
PREREQUISITES:
1. Backend server must be running: uvicorn main:app --reload
2. Redis must be running: brew services start redis
3. Admin user exists (username: admin, password: admin123)

TEST PROCEDURE:
""")

# Step 1
log("STEP 1: Student Places Order")
print("""
Terminal 1 (Backend Server):
  cd backend
  source venv/bin/activate
  uvicorn main:app --reload --host 0.0.0.0 --port 8000

Terminal 2 (Create Order):
  # Register student
  curl -X POST http://localhost:8000/auth/register \\
    -H "Content-Type: application/json" \\
    -d '{"username":"student1","email":"s1@test.com","password":"pass123","full_name":"Student One"}'
  
  # Login and save token
  TOKEN=$(curl -X POST http://localhost:8000/auth/login \\
    -d "username=student1&password=pass123" | jq -r '.access_token')
  
  USER_ID=$(curl -X POST http://localhost:8000/auth/login \\
    -d "username=student1&password=pass123" | jq -r '.user_id')
  
  # Get menu
  curl http://localhost:8000/menu/ | jq '.[0]'
  
  # Place order (use menu_item_id from above)
  ORDER_ID=$(curl -X POST http://localhost:8000/orders/ \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"items":[{"menu_item_id":1,"quantity":2}]}' | jq -r '.id')
  
  echo "Order ID: $ORDER_ID"

✅ VERIFY: Order created with status "Pending"
""")

# Step 2
log("STEP 2: Admin Updates Status")
print("""
Terminal 2 (Admin Update):
  # Login as admin
  ADMIN_TOKEN=$(curl -X POST http://localhost:8000/auth/login \\
    -d "username=admin&password=admin123" | jq -r '.access_token')
  
  # Update order status
  curl -X PATCH http://localhost:8000/admin/orders/$ORDER_ID/status \\
    -H "Authorization: Bearer $ADMIN_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"Preparing"}' | jq

✅ VERIFY: Status updated to "Preparing"
""")

# Step 3
log("STEP 3: Student Sees Update in <1s (SSE)")
print("""
Terminal 3 (SSE Listener - Start BEFORE Step 2):
  # Subscribe to real-time updates
  curl -N http://localhost:8000/events/orders/$USER_ID \\
    -H "Authorization: Bearer $TOKEN"

Terminal 2 (Trigger Update):
  # Update status again
  curl -X PATCH http://localhost:8000/admin/orders/$ORDER_ID/status \\
    -H "Authorization: Bearer $ADMIN_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"Ready"}'

✅ VERIFY: Terminal 3 receives SSE event within <1 second
  Expected output: data: {"order_id":X,"status":"Ready","timestamp":"..."}
""")

# Step 4
log("STEP 4: Redis Restarted → Fallback Works")
print("""
Terminal 4 (Stop Redis):
  brew services stop redis
  
Terminal 2 (Test Fallback):
  # Try to get menu (should still work)
  curl http://localhost:8000/menu/ | jq length
  
  # Try SSE (should return 503)
  curl -N http://localhost:8000/events/orders/$USER_ID \\
    -H "Authorization: Bearer $TOKEN"

✅ VERIFY: 
  - Menu endpoint returns data (graceful degradation)
  - SSE returns 503 Service Unavailable
  - Backend logs show: "⚠️ Redis unavailable"
""")

# Step 5
log("STEP 5: Redis Restored → Real-Time Resumes")
print("""
Terminal 4 (Start Redis):
  brew services start redis
  sleep 2
  redis-cli ping  # Should return PONG

Terminal 3 (Restart SSE Listener):
  curl -N http://localhost:8000/events/orders/$USER_ID \\
    -H "Authorization: Bearer $TOKEN"

Terminal 2 (Trigger Update):
  curl -X PATCH http://localhost:8000/admin/orders/$ORDER_ID/status \\
    -H "Authorization: Bearer $ADMIN_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"Completed"}'

✅ VERIFY:
  - Terminal 3 receives SSE event
  - Backend logs show: "✅ Redis: Connected"
  - Real-time updates working again
""")

log("AUTOMATED TEST SCRIPT")
print("""
For automated testing, run:
  cd backend
  source venv/bin/activate
  
  # Start backend in background
  uvicorn main:app --host 0.0.0.0 --port 8000 &
  BACKEND_PID=$!
  
  # Run automated test
  python test_e2e_realtime.py
  
  # Stop backend
  kill $BACKEND_PID

Note: Automated test requires backend to be running
""")

log("EXPECTED RESULTS SUMMARY")
print("""
✅ Step 1: Order created successfully
✅ Step 2: Admin can update status
✅ Step 3: SSE delivers update in <1 second
✅ Step 4: System works without Redis (graceful degradation)
✅ Step 5: Real-time resumes after Redis restart

KEY OBSERVATIONS:
• SSE latency: <100ms typically
• Redis down: Menu/orders still work, SSE returns 503
• Redis restored: SSE reconnects automatically
• No data loss during Redis restart
• Rate limiting disabled during Redis downtime (fail-safe)
""")

print("\n" + "="*60)
print("Test procedure ready. Follow steps above to verify.")
print("="*60 + "\n")
