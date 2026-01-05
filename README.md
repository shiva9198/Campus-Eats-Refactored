# Campus Eats

**Internal Codename:** Iron Rations  
**Production System:** College Canteen Order Management

A real-world food ordering system built under strict constraints: **7-day deadline**, **zero-cost budget**, **APK ≤ 20 MB**.

---

## Architecture

- **Frontend:** React Native CLI 0.76 (Android)
- **Backend:** FastAPI (Python 3.14 compatible)
- **Database:** PostgreSQL (via `pg8000`)
- **Images:** Cloudinary (free tier)
- **Auth:** Mock Bearer tokens (production upgrade required)

---

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Swagger Docs:** http://localhost:8000/docs

### Mobile (Android)

```bash
cd mobile
npm install
npx react-native run-android
```

**Release APK Build:**
```bash
cd mobile/android
./gradlew assembleRelease
# APK: mobile/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

---

## Constraints Met

| Constraint | Status |
|------------|--------|
| 7-Day Deadline | ✅ Completed |
| Zero Cost | ✅ Free tier only |
| APK Size ≤ 20 MB | ✅ 13.4 MB (arm64-v8a) |
| React Native CLI | ✅ No Expo |
| PostgreSQL | ✅ Pure Python driver |

---

## Features

### Student Features
- Browse menu (with Cloudinary images)
- Add items to cart (in-memory)
- Place orders
- Submit payment proof (manual)
- Track order status (polling)

### Admin Features
- Toggle item availability (stock management)
- View all orders
- Update order status (Pending → Preparing → Ready)

---

## API Endpoints

### Menu
```
GET  /menu              # List all items (with availability)
POST /menu              # Create item (admin)
PATCH /menu/{id}/availability  # Toggle stock (admin)
```

### Orders
```
POST /orders/           # Create order
GET  /orders/{id}       # Get order details
```

### Admin
```
PATCH /admin/orders/{id}/status  # Update order status
```

**Auth Header (Mock):**
```
Authorization: Bearer admin
```

---

## Known Limitations

1. **Manual Payments:** UPI QR + screenshot upload (no gateway integration)
2. **Polling Updates:** 15-second intervals (no WebSocket/SSE)
3. **Mock Auth:** Bearer tokens without JWT verification
4. **Single Payment Method:** UPI only

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # PostgreSQL connection
│   ├── auth.py              # Mock auth provider
│   └── routers/
│       ├── menu.py
│       ├── orders.py
│       └── admin.py
│
└── mobile/
    ├── App.tsx              # Root component
    ├── android/             # Native Android config
    └── src/
        ├── api/client.ts    # Axios client
        ├── components/      # MenuItem
        ├── screens/         # Menu, Cart, Payment, Status
        └── context/         # CartContext
```

---

## Verification

Run full system test:
```bash
python verify_full_system.py
```

Expected output:
```
[1/5] Testing Menu API... ✅
[2/5] Testing Order Flow... ✅
[3/5] Testing Inventory Management... ✅
[4/5] Testing Admin Auth... ✅
[5/5] Testing Backend Health... ✅

🎉 All systems verified! Ready for production.
```

---

## Development Timeline

| Day | Focus | Status |
|-----|-------|--------|
| 1 | Foundation (FastAPI + RN CLI) | ✅ |
| 2 | Menu CRUD | ✅ |
| 3 | Order Flow | ✅ |
| 4 | Payment & Status | ✅ |
| 5 | Inventory Management | ✅ |
| 6 | APK Optimization (ProGuard + Splits) | ✅ |
| 7 | Verification & Handover | ✅ |

---

## ProGuard Configuration

Release builds use ProGuard with these critical keep rules:
```proguard
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class okhttp3.** { *; }
```

See: `mobile/android/app/proguard-rules.pro`

---

## License

Private - Internal College Project
