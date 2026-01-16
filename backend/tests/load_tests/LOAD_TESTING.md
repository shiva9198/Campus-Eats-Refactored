# Food Ordering System - Load Testing Guide

## 📋 Prerequisites

```bash
# Install Locust
pip install locust

# Or with specific version
pip install locust==2.15.1
```

## 🚀 Running the Tests

### 1. Basic Test Run

```bash
# Start Locust with web UI
locust -f locustfile.py --host=http://localhost:3000

# Then open browser to: http://localhost:8089
```

### 2. Web UI Configuration

When you open the web UI, you'll see:

- **Number of users**: Total students to simulate (e.g., 100, 500, 1000)
- **Spawn rate**: How many users per second to add (e.g., 10)
- **Host**: Your API base URL

**Recommended Test Scenarios:**

#### Scenario 1: Normal Operations
- Users: 50
- Spawn rate: 5/second
- Duration: 5 minutes

#### Scenario 2: Lunch Rush (12-1 PM)
- Users: 200
- Spawn rate: 20/second  
- Duration: 10 minutes

#### Scenario 3: Stress Test
- Users: 500
- Spawn rate: 50/second
- Duration: 15 minutes

### 3. Command Line (Headless) Testing

```bash
# Run without web UI - good for CI/CD
locust -f locustfile.py \
  --host=http://localhost:3000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless

# With HTML report
locust -f locustfile.py \
  --host=http://localhost:3000 \
  --users 200 \
  --spawn-rate 20 \
  --run-time 10m \
  --headless \
  --html=report.html
```

### 4. Peak Hour Simulation

```bash
# Use only PeakHourUser class for lunch rush testing
locust -f locustfile.py \
  --host=http://localhost:3000 \
  --users 300 \
  --spawn-rate 30 \
  PeakHourUser
```

## 🔧 Configuration Options

### Environment Variables

Create a `.env` file:

```env
BASE_URL=http://localhost:3000
TEST_USER_PASSWORD=test123
MIN_ITEM_ID=1
MAX_ITEM_ID=50
```

### Custom Locust Configuration File

Create `locust.conf`:

```ini
host = http://localhost:3000
users = 100
spawn-rate = 10
run-time = 10m
headless = false
```

Then run: `locust -f locustfile.py --config=locust.conf`

## 📊 Understanding the Results

### Key Metrics to Watch

1. **Response Time (ms)**
   - p50: 50% of requests faster than this
   - p95: 95% of requests faster than this
   - p99: 99% of requests faster than this

2. **Requests per Second (RPS)**
   - How many requests your system handles

3. **Failure Rate (%)**
   - Should be < 1% for healthy system
   - Watch for specific endpoints failing

4. **Number of Users**
   - Maximum concurrent users before performance degrades

### What to Look For

✅ **Good Performance:**
- p95 response time < 500ms for API calls
- p99 response time < 1000ms
- Failure rate < 0.5%
- Consistent RPS as users increase

⚠️ **Warning Signs:**
- Response times increasing linearly with users
- Sudden spikes in failures
- Timeouts on critical endpoints (login, order placement)

## 🎯 Customizing for Your System

### 1. Update API Endpoints

Edit the script to match your actual endpoints:

```python
# Change these in locustfile.py
"/api/auth/login"          → Your login endpoint
"/api/menu"                → Your menu endpoint
"/api/cart/add"            → Your cart endpoint
"/api/orders"              → Your order endpoint
```

### 2. Adjust Test Data

```python
# Modify in the script
student_id = random.randint(1000, 9999)  # Your student ID range
item_id = random.randint(1, 50)          # Your menu item IDs
```

### 3. Update Authentication

If your JWT is returned differently:

```python
# In login() method, change:
self.token = data.get("token")  # Or data["data"]["token"], etc.
```

### 4. Add Real-Time WebSocket Testing

For real-time order status, install websocket support:

```bash
pip install locust-plugins
```

Add to your script:

```python
from locust import task
from locust.contrib.fasthttp import FastHttpUser
import websocket

class WebSocketUser(FastHttpUser):
    @task
    def websocket_order_status(self):
        ws = websocket.create_connection(
            f"ws://localhost:3000/ws/orders/{self.order_id}"
        )
        ws.recv()  # Receive status update
        ws.close()
```

## 📈 Recommended Testing Strategy

### Phase 1: Baseline (Week 1)
- Test with 50 users
- Identify bottlenecks
- Fix critical issues

### Phase 2: Target Load (Week 2)
- Test with expected peak (e.g., 200 students)
- Monitor database connections
- Check memory usage

### Phase 3: Stress Test (Week 3)
- Test with 2x expected load
- Find breaking point
- Plan scaling strategy

### Phase 4: Endurance Test
```bash
locust -f locustfile.py \
  --host=http://localhost:3000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 2h \
  --headless
```

## 🔍 Monitoring During Tests

While tests run, monitor:

1. **Application Logs** - Check for errors
2. **Database** - Query performance, connection pool
3. **CPU/Memory** - Server resource usage
4. **Network** - Bandwidth utilization

## 🛠️ Troubleshooting

### High Failure Rate

```bash
# Add verbose logging
locust -f locustfile.py --host=http://localhost:3000 --loglevel DEBUG
```

### Connection Errors

- Check if API is running
- Verify host URL is correct
- Check firewall/network settings

### SSL Certificate Issues

```bash
# Disable SSL verification (testing only!)
locust -f locustfile.py --host=https://your-api.com --insecure
```

## 📁 Sample Test Report Structure

After running, you'll see:

```
Type        Name                      # Requests  # Fails  Median  95%ile  RPS
---------------------------------------------------------------------------
POST        /api/auth/login           1000        0        45      120     10.5
GET         /api/menu                 5000        2        30      85      52.3
POST        /api/cart/add             3000        1        55      150     31.2
POST        /api/orders               2000        5        180     450     20.8
GET         /api/orders/[id]/status   4000        0        25      70      41.7
---------------------------------------------------------------------------
```

## 🎓 Next Steps

1. Run baseline test with current system
2. Document your maximum capacity
3. Identify slowest endpoints
4. Optimize code/database
5. Re-test and compare results
6. Set up monitoring alerts based on test results

Good luck with your load testing! 🚀
