# Campus Eats

**Internal Codename:** Iron Rations  
**Production System:** College Canteen Order Management

A real-world food ordering system built under strict constraints: **7-day deadline**, **zero-cost budget**, **APK ≤ 20 MB**.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [UI Flow Demonstrations](#ui-flow-demonstrations)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Project Structure](#project-structure)
- [Build & Deployment](#build--deployment)
- [Verification](#verification)
- [Constraints Met](#constraints-met)
- [Known Limitations](#known-limitations)

---

## Architecture Overview

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Mobile App (React Native)"
        A[Student App] --> B[API Client]
        C[Admin App] --> B
        B --> D[Auth Context]
        B --> E[Cart Context]
    end
    
    subgraph "Backend (FastAPI)"
        F[Main App] --> G[Auth Middleware]
        G --> H[RBAC Middleware]
        H --> I[Rate Limiter]
        I --> J[Routers]
        J --> K[Menu Router]
        J --> L[Orders Router]
        J --> M[Admin Router]
        J --> N[Payments Router]
        J --> O[Events Router SSE]
    end
    
    subgraph "Data Layer"
        P[(PostgreSQL)]
        Q[Redis Cache]
        R[Cloudinary CDN]
    end
    
    B --> F
    K --> P
    L --> P
    M --> P
    N --> P
    K --> Q
    K --> R
    O --> Q
```

### Mobile App Architecture

**Framework:** React Native CLI 0.76 (Android)

```
mobile/
├── App.tsx                          # Root component with navigation setup
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Role-based routing (Student/Admin)
│   ├── context/
│   │   ├── AuthContext.tsx          # JWT auth state, login/logout
│   │   └── CartContext.tsx          # In-memory cart management
│   ├── api/
│   │   └── client.ts                # Axios client with JWT interceptor
│   ├── screens/
│   │   ├── student/                 # Student-specific screens
│   │   │   ├── MenuScreen.tsx       # Browse menu, filters, search
│   │   │   ├── CartScreen.tsx       # Review cart, place order
│   │   │   ├── PaymentScreen.tsx    # UPI instructions, proof upload
│   │   │   └── OrderStatusScreen.tsx # Real-time status tracking
│   │   └── admin/                   # Admin-specific screens
│   │       ├── DashboardScreen.tsx  # Stats, shop toggle
│   │       ├── OrdersScreen.tsx     # Tabbed view (To Verify/Kitchen)
│   │       ├── PaymentVerifyScreen.tsx # Verify payment proof
│   │       └── CollectOrderScreen.tsx # OTP-based collection
│   ├── components/
│   │   ├── AppHeader.tsx            # Role-aware header
│   │   ├── MenuItem.tsx             # Menu item card
│   │   ├── PrimaryButton.tsx        # Reusable button
│   │   └── AuthInput.tsx            # Styled input field
│   └── types/
│       └── index.ts                 # TypeScript interfaces
```

**Key Features:**
- **JWT Authentication:** Token stored in AsyncStorage, auto-injected in API calls
- **Role-Based Routing:** Different navigation stacks for Student/Admin
- **Real-Time Updates:** 15-second polling for order status
- **Offline-First Cart:** In-memory cart with context API
- **Image Upload:** Payment proof via React Native Image Picker

---

### Backend Architecture

**Framework:** FastAPI (Python 3.12)

```
backend/
├── main.py                          # FastAPI app, middleware, routers
├── core/                            # Core configuration & auth
│   ├── config.py                    # Environment settings
│   ├── auth.py                      # JWT utilities
│   └── dependencies.py              # Dependency injection
├── db/                              # Database layer
│   ├── session.py                   # Engine & Session
│   ├── models.py                    # SQLAlchemy Models
│   └── schemas.py                   # Pydantic Schemas
├── services/                        # Business logic services
│   └── redis.py                     # Redis interface
├── middleware/
│   └── rate_limit.py                # Rate limiting middleware
├── routers/                         # API Routes
│   ├── auth.py
│   ├── menu.py
│   ├── orders.py
│   ├── payments.py
│   ├── admin.py
│   ├── upload.py
│   ├── events.py
│   └── health.py
└── static/
    └── uploads/                     # Local payment proof storage
```

**Middleware Stack (Execution Order):**
1. **CORS Middleware:** Allow all origins (development)
2. **Rate Limit Middleware:** Redis-backed per-user rate limiting
3. **Request Logging Middleware:** Log method, path, status, duration
4. **Auth Middleware:** JWT validation (applied per-router)
5. **RBAC Middleware:** Role-based access control (admin-only routes)

**Key Features:**
- **JWT Authentication:** Argon2 password hashing, token expiry
- **RBAC Enforcement:** Decorator-based role checks (`@require_role("admin")`)
- **Redis Integration:** Rate limiting, hot data caching, SSE pub/sub
- **Graceful Degradation:** System works without Redis (falls back to in-memory)
- **Global Exception Handlers:** 500/422 errors with user-friendly messages

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile** | React Native CLI 0.76 | Android app (no Expo) |
| **Backend** | FastAPI (Python 3.12) | REST API server |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | SQLAlchemy | Database models & queries |
| **Cache** | Redis | Rate limiting, caching, pub/sub |
| **Auth** | JWT + Argon2 | Token-based auth, password hashing |
| **Storage** | Cloudinary (Free Tier) | Menu item images |
| **Image Upload** | Local Storage | Payment proof screenshots |
| **Real-Time** | Server-Sent Events (SSE) | Order status updates |
| **Deployment** | Render/Railway (Backend) | Zero-cost hosting |

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (for React Native)
- **Python** 3.12+ (for FastAPI)
- **PostgreSQL** 14+ (local or cloud)
- **Redis** 7+ (optional, for rate limiting/caching)
- **Android Studio** (for emulator)

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/campus_eats"
export SECRET_KEY="your-secret-key-here"
export REDIS_URL="redis://localhost:6379"  # Optional

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Swagger Docs:** http://localhost:8000/docs

### Mobile Setup (Android)

```bash
cd mobile
npm install

# Start Metro bundler
npm start

# In another terminal, run on emulator
npx react-native run-android
```

### Real Device Setup (Important)

To run on a physical device, you must expose the backend via ngrok and update the app config:

1.  **Start Backend**: `uvicorn main:app --host 0.0.0.0 --reload`
2.  **Start Ngrok**: `ngrok http 8000`
3.  **Update Config**: Run `./update_ngrok_url.sh` in the project root.
4.  **Install**: `cd mobile/android && ./gradlew installRelease`

---

## UI Flow Demonstrations

### Student Flow (10 Screenshots)

Complete order journey from login to order completion.

| Screenshot | Description |
|------------|-------------|
| ![S01](realtime-ui-proof/student/S01_login_empty.png) | **S01: Login Screen (Empty)** - Initial login screen |
| ![S02](realtime-ui-proof/student/S02_login_filled.png) | **S02: Login Screen (Filled)** - Credentials entered |
| ![S03](realtime-ui-proof/student/S03_menu_browse.png) | **S03: Menu Browse** - Browse menu with filters |
| ![S04](realtime-ui-proof/student/S04_cart_with_item.png) | **S04: Cart with Item** - Item added to cart |
| ![S05](realtime-ui-proof/student/S05_order_confirmation.png) | **S05: Order Confirmation** - Confirm order dialog |
| ![S06](realtime-ui-proof/student/S06_payment_required.png) | **S06: Payment Required** - UPI payment instructions |
| ![S07](realtime-ui-proof/student/S07_status_verifying_payment.png) | **S07: Verifying Payment** - Payment verification in progress |
| ![S08](realtime-ui-proof/student/S08_status_preparing.png) | **S08: Preparing** - Order being prepared (OTP: 7702) |
| ![S09](realtime-ui-proof/student/S09_status_ready.png) | **S09: Ready** - Order ready for pickup |
| ![S10](realtime-ui-proof/student/S10_status_completed.png) | **S10: Completed** - Order collected and completed |

**Student Journey:**
1. **Login** → Enter credentials (username: `student`, password: `password`)
2. **Browse Menu** → View items with filters (Veg/Non-Veg, Categories, Search)
3. **Add to Cart** → Select items and quantities
4. **Confirm Order** → Review cart and place order
5. **Payment** → View UPI ID, upload payment proof screenshot
6. **Track Status** → Real-time updates (Verifying → Preparing → Ready → Completed)
7. **Collect Order** → OTP displayed for admin verification

---

### Admin Flow (12 Screenshots)

Complete admin workflow from login to order collection.

| Screenshot | Description |
|------------|-------------|
| ![A01](realtime-ui-proof/admin/A01_admin_login.png) | **A01: Admin Login** - Admin login screen |
| ![A02](realtime-ui-proof/admin/A02_dashboard.png) | **A02: Dashboard** - Stats, revenue, shop toggle |
| ![A03](realtime-ui-proof/admin/A03_orders_to_verify.png) | **A03: To Verify Tab** - Orders awaiting payment verification |
| ![A04](realtime-ui-proof/admin/A04_order_details_pending.png) | **A04: Order Details** - Pending verification details |
| ![A05](realtime-ui-proof/admin/A05_payment_verification.png) | **A05: Payment Verification** - Zoomable payment proof |
| ![A06](realtime-ui-proof/admin/A06_orders_kitchen.png) | **A06: Kitchen Tab** - Paid orders ready to prepare |
| ![A07](realtime-ui-proof/admin/A07_order_paid_ready_to_prepare.png) | **A07: Order Details (Paid)** - Ready to start preparing |
| ![A08](realtime-ui-proof/admin/A08_status_updated_preparing.png) | **A08: Status Updated** - Preparing confirmation |
| ![A09](realtime-ui-proof/admin/A09_collect_order_otp_entry.png) | **A09: OTP Entry** - Enter student's OTP |
| ![A10](realtime-ui-proof/admin/A10_collect_order_found.png) | **A10: Order Found** - OTP verified, order details |
| ![A11](realtime-ui-proof/admin/A11_collection_success.png) | **A11: Collection Success** - Order marked completed |
| ![A12](realtime-ui-proof/admin/A12_order_details_ready.png) | **A12: Order Details (Ready)** - Ready status view |

**Admin Journey:**
1. **Login** → Enter admin credentials
2. **Dashboard** → View daily revenue, order counts, shop status
3. **To Verify Tab** → Review orders awaiting payment verification
4. **Verify Payment** → View payment proof (zoomable), approve/reject
5. **Kitchen Tab** → View paid orders ready for preparation
6. **Start Preparing** → Update order status to "Preparing"
7. **Mark Ready** → Update status to "Ready" (generates OTP)
8. **Collect Order** → Enter student's OTP, verify, mark as "Completed"

---

## Features

### Student Features
✅ **Authentication:** Login with username/password (JWT-based)  
✅ **Menu Browsing:** View items with Cloudinary images  
✅ **Filters & Search:** Veg/Non-Veg toggle, category chips, search bar  
✅ **Cart Management:** Add/remove items, quantity adjustment  
✅ **Order Placement:** Server-side price validation  
✅ **Payment Proof:** Upload UPI payment screenshot  
✅ **Real-Time Tracking:** 15-second polling for status updates  
✅ **OTP Display:** Collection OTP shown when order is ready  
✅ **Shop Status Awareness:** Cannot order when shop is closed  

### Admin Features
✅ **Dashboard:** Daily revenue, pending/active order counts  
✅ **Shop Toggle:** Open/close shop (blocks new orders when closed)  
✅ **Payment Verification:** Zoomable proof images, approve/reject workflow  
✅ **Order Management:** Tabbed view (To Verify / Kitchen)  
✅ **Status Updates:** Pending → Paid → Preparing → Ready → Completed  
✅ **OTP Generation:** Auto-generated 4-digit OTP on payment approval  
✅ **Order Collection:** OTP-based verification for pickup  
✅ **Menu Management:** Create, edit, delete items, toggle availability  

---

## API Documentation

### Authentication

#### Register (Student Only)
```http
POST /auth/register
Content-Type: application/json

{
  "username": "student1",
  "email": "student1@college.edu",
  "password": "securepass",
  "full_name": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=student&password=password
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "student",
    "role": "student"
  }
}
```

---

### Menu

#### List Menu Items
```http
GET /menu
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Masala Dosa",
    "description": "Crispy dosa with potato filling",
    "price": 50,
    "category": "Breakfast",
    "image_url": "https://res.cloudinary.com/...",
    "is_vegetarian": true,
    "is_available": true
  }
]
```

#### Create Menu Item (Admin Only)
```http
POST /menu
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese",
  "price": 120,
  "category": "Snacks",
  "image_url": "https://res.cloudinary.com/...",
  "is_vegetarian": true
}
```

#### Toggle Availability (Admin Only)
```http
PATCH /menu/{id}/availability
Authorization: Bearer {admin_token}
```

---

### Orders

#### Create Order
```http
POST /orders
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "items": [
    {"menu_item_id": 1, "quantity": 2},
    {"menu_item_id": 3, "quantity": 1}
  ]
}
```

**Response:**
```json
{
  "id": 34,
  "user_id": 1,
  "status": "Pending",
  "total_amount": 150,
  "items": [...],
  "created_at": "2026-01-08T12:30:00Z"
}
```

#### Get Order Details
```http
GET /orders/{id}
Authorization: Bearer {token}
```

---

### Payments

#### Submit Payment Proof
```http
POST /payments/submit-proof
Authorization: Bearer {student_token}
Content-Type: multipart/form-data

order_id=34
proof_image={file}
```

---

### Admin

#### Update Order Status
```http
PATCH /admin/orders/{id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "Preparing"
}
```

#### Verify Payment
```http
POST /admin/orders/{id}/verify-payment
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "approved": true,
  "rejection_reason": null  // Required if approved=false
}
```

#### Collect Order (OTP Verification)
```http
POST /admin/orders/collect
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "otp": "7702"
}
```

---

### Real-Time Events (SSE)

#### Subscribe to Order Updates
```http
GET /events/stream?order_id=34
Authorization: Bearer {token}
```

**Event Stream:**
```
data: {"event": "status_update", "order_id": 34, "status": "Preparing"}

data: {"event": "status_update", "order_id": 34, "status": "Ready"}
```

---

## Database Schema

### Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Order : places
    Order ||--|{ OrderItem : contains
    MenuItem ||--o{ OrderItem : "ordered as"
    
    User {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }
    
    MenuItem {
        int id PK
        string name
        string description
        int price
        string category
        string image_url
        boolean is_vegetarian
        boolean is_available
        datetime created_at
    }
    
    Order {
        int id PK
        int user_id FK
        string status
        int total_amount
        string otp
        string verified_by
        string verification_proof
        string rejection_reason
        datetime created_at
    }
    
    OrderItem {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        int price
    }
    
    Setting {
        string key PK
        string value
        string category
        string description
        datetime updated_at
    }
```

### Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Order Created
    Pending --> Pending_Verification: Payment Proof Submitted
    Pending_Verification --> Paid: Admin Approves (OTP Generated)
    Pending_Verification --> Payment_Rejected: Admin Rejects
    Paid --> Preparing: Admin Starts Cooking
    Preparing --> Ready: Food Ready
    Ready --> Completed: OTP Verified (Customer Collected)
    Payment_Rejected --> [*]
    Completed --> [*]
```

**Status Transitions:**
- `Pending` → Order created, awaiting payment
- `Pending_Verification` → Payment proof uploaded, awaiting admin review
- `Paid` → Payment approved, OTP generated
- `Preparing` → Kitchen preparing order
- `Ready` → Order ready for pickup
- `Completed` → Customer collected order (OTP verified)
- `Payment_Rejected` → Payment proof rejected by admin

---

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant DB
    
    Client->>API: POST /auth/login (username, password)
    API->>DB: Fetch user by username
    DB-->>API: User record
    API->>Auth: Verify password (Argon2)
    Auth-->>API: Password valid
    API->>Auth: Generate JWT token
    Auth-->>API: Token (expires in 7 days)
    API-->>Client: {access_token, user}
    
    Client->>API: GET /orders (Authorization: Bearer token)
    API->>Auth: Validate JWT
    Auth-->>API: Token valid, user_id=1, role=student
    API->>DB: Fetch orders for user_id=1
    DB-->>API: Orders
    API-->>Client: Orders
```

### Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **Password Hashing** | Argon2 | Industry-standard, memory-hard hashing |
| **JWT Tokens** | HS256 algorithm | Stateless authentication |
| **Token Expiry** | 7 days | Automatic logout after expiry |
| **RBAC** | Role-based decorators | Restrict admin routes to admin users |
| **Rate Limiting** | Redis-backed | Prevent abuse (100 req/min per user) |
| **SQL Injection** | SQLAlchemy ORM | Parameterized queries |
| **CORS** | Middleware | Allow only trusted origins (production) |
| **Input Validation** | Pydantic schemas | Type-safe request validation |

---

## Project Structure

```
Campus-Eats-Clone/
├── backend/                         # FastAPI backend
│   ├── main.py                      # App entry point, middleware
│   ├── database.py                  # PostgreSQL connection
│   ├── models.py                    # SQLAlchemy models
│   ├── schemas.py                   # Pydantic schemas
│   ├── auth.py                      # JWT utilities
│   ├── redis_client.py              # Redis connection
│   ├── middleware/
│   │   └── rate_limit.py            # Rate limiting middleware
│   ├── routers/
│   │   ├── auth.py                  # Authentication endpoints
│   │   ├── menu.py                  # Menu CRUD
│   │   ├── orders.py                # Order management
│   │   ├── payments.py              # Payment proof upload
│   │   ├── admin.py                 # Admin operations
│   │   ├── upload.py                # File upload
│   │   ├── events.py                # SSE real-time events
│   │   └── health.py                # Health check
│   ├── static/
│   │   └── uploads/                 # Payment proof storage
│   └── requirements.txt
│
├── mobile/                          # React Native app
│   ├── App.tsx                      # Root component
│   ├── index.js                     # Entry point
│   ├── src/
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx     # Role-based navigation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state management
│   │   │   └── CartContext.tsx      # Cart state management
│   │   ├── api/
│   │   │   └── client.ts            # Axios client with JWT
│   │   ├── screens/
│   │   │   ├── student/
│   │   │   │   ├── MenuScreen.tsx
│   │   │   │   ├── CartScreen.tsx
│   │   │   │   ├── PaymentScreen.tsx
│   │   │   │   └── OrderStatusScreen.tsx
│   │   │   ├── admin/
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── OrdersScreen.tsx
│   │   │   │   ├── PaymentVerifyScreen.tsx
│   │   │   │   └── CollectOrderScreen.tsx
│   │   │   └── LoginScreen.tsx
│   │   ├── components/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── MenuItem.tsx
│   │   │   ├── PrimaryButton.tsx
│   │   │   └── AuthInput.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── constants.ts
│   ├── android/
│   │   ├── app/
│   │   │   ├── build.gradle         # Build config
│   │   │   ├── proguard-rules.pro   # ProGuard rules
│   │   │   └── src/main/
│   │   │       ├── AndroidManifest.xml
│   │   │       └── res/             # App icons, splash screen
│   │   └── gradle.properties
│   ├── package.json
│   └── tsconfig.json
│
├── realtime-ui-proof/               # UI screenshots
│   ├── student/                     # 10 student flow screenshots
│   └── admin/                       # 12 admin flow screenshots
│
├── assets/                          # Branding assets
│   ├── app_icon.png
│   └── in_app_logo.png
│
├── .agent/                          # Workflows
│   └── workflows/
│       ├── android-debug.md
│       └── android-release.md
│
├── README.md                        # This file
├── ARCHITECTURE.md                  # Detailed architecture doc
├── FEATURE_PARITY.md                # Feature comparison
└── render.yaml                      # Deployment config
```

---

## Build & Deployment

### Debug Build (Emulator)

```bash
cd mobile

# Start Metro bundler
npm start

# In another terminal
npx react-native run-android
```

**Or use workflow:**
```bash
# See .agent/workflows/android-debug.md
```

---

### Release Build (Physical Device)

```bash
cd mobile/android

# Clean build
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Output: mobile/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

**Install on device:**
```bash
adb install -r app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

**Or use workflow:**
```bash
# See .agent/workflows/android-release.md
```

---

### ProGuard Configuration

Release builds use ProGuard with these critical keep rules:

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# OkHttp (Networking)
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }
```

See: [`mobile/android/app/proguard-rules.pro`](file:///Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile/android/app/proguard-rules.pro)

---

### Backend Deployment (Render)

**Configuration:** [`render.yaml`](file:///Users/shiva/Documents/github_projects/Campus-Eats-Clone/render.yaml)

```yaml
services:
  - type: web
    name: campus-eats-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: REDIS_URL
        sync: false
```

**Deploy:**
1. Push to GitHub
2. Connect Render to repository
3. Set environment variables
4. Deploy

---

## Verification

### Full System Test

```bash
python verify_full_system.py
```

**Expected Output:**
```
[1/5] Testing Menu API... ✅
[2/5] Testing Order Flow... ✅
[3/5] Testing Inventory Management... ✅
[4/5] Testing Admin Auth... ✅
[5/5] Testing Backend Health... ✅

🎉 All systems verified! Ready for production.
```

---

### Manual Testing Checklist

**Student Flow:**
- [ ] Login with student credentials
- [ ] Browse menu with filters
- [ ] Add items to cart
- [ ] Place order
- [ ] Upload payment proof
- [ ] Track order status (real-time updates)
- [ ] View OTP when ready
- [ ] Logout

**Admin Flow:**
- [ ] Login with admin credentials
- [ ] View dashboard stats
- [ ] Toggle shop status
- [ ] Verify payment proof (zoom, approve/reject)
- [ ] Update order status (Preparing → Ready)
- [ ] Enter OTP to collect order
- [ ] Create/edit menu items
- [ ] Logout

---

## Constraints Met

| Constraint | Target | Achieved | Status |
|------------|--------|----------|--------|
| **Deadline** | 7 days | 7 days | ✅ |
| **Budget** | ₹0 | ₹0 (Free tiers only) | ✅ |
| **APK Size** | ≤ 20 MB | 13.4 MB (arm64-v8a) | ✅ |
| **Framework** | React Native CLI | React Native CLI 0.76 | ✅ |
| **Database** | PostgreSQL | PostgreSQL (pg8000) | ✅ |
| **No Expo** | Hard requirement | Pure React Native CLI | ✅ |

---

## Known Limitations

> [!WARNING]
> These are intentional trade-offs due to time/budget constraints.

1. **Manual Payments:** UPI QR + screenshot upload (no Razorpay/Stripe integration)
2. **Polling Updates:** 15-second intervals (SSE available but not used in mobile app)
3. **Local Payment Proof Storage:** Stored in `backend/static/uploads` (not Cloudinary)
4. **Single Payment Method:** UPI only (no cash/card)
5. **No Push Notifications:** Real-time updates via polling only
6. **No Delivery Tracking:** Pickup-only system
7. **No In-App Wallet:** No stored balance or refunds

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
| 8 | Production Hardening | ✅ |
| 9 | Database Constraints | ✅ |
| 10 | JWT Auth + RBAC | ✅ |
| 11 | Redis Integration | ✅ |
| 12 | UI Polish + Screenshots | ✅ |

---

## License

**Private - Internal College Project**

---

## Screenshots Source

All screenshots captured from real Android emulator (emulator-5554) on **January 8, 2026**.

**Test Order Details:**
- Order ID: #34
- Amount: ₹150
- Item: Verification Burger 974
- Collection OTP: 7702

---

**Built with ❤️ for Campus Eats**
