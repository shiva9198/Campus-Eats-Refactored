# System Architecture & Implementation Status

> [!IMPORTANT]
> This document reflects the **actual implemented architecture** based on code analysis.
> Architecture has been verified against production codebase.

## ✅ IMPLEMENTED ARCHITECTURE

### Core Technology Stack
- **Mobile**: React Native CLI 0.76 (Android-focused), TypeScript
- **Backend**: FastAPI (Python 3.12) with SQLAlchemy ORM
- **Database**: PostgreSQL with pg8000 driver (pure Python)
- **Caching**: Redis with graceful degradation
- **Storage**: Cloudinary CDN for image hosting
- **Auth**: JWT (HS256) with RBAC and 5-hour token expiry
- **Rate Limiting**: Redis-based per-user and global rate limiting

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP                           │
│                (React Native CLI 0.76)                 │
├─────────────────────────────────────────────────────────┤
│  App.tsx (Root)                                         │
│  ├─ AuthContext (JWT token management)                  │
│  ├─ CartContext (In-memory state)                      │
│  └─ Role-based Navigation                               │
│      ├─ Student Flow: Menu → Cart → Payment → Status   │
│      └─ Admin Flow: Dashboard → Orders → Verification  │
├─────────────────────────────────────────────────────────┤
│  API Client (axios)                                     │
│  ├─ Request Interceptor (JWT injection)                │
│  ├─ Response Interceptor (401 handling)                │
│  └─ 10s timeout configuration                          │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                        │
├─────────────────────────────────────────────────────────┤
│  main.py (Application entry)                           │
│  ├─ CORS middleware                                     │
│  ├─ RateLimitMiddleware (Redis-based)                   │
│  ├─ Request logging middleware                          │
│  └─ Static file serving                                 │
├─────────────────────────────────────────────────────────┤
│  Authentication Layer                                   │
│  ├─ JWT creation/validation (jose library)             │
│  ├─ Password hashing (bcrypt)                          │
│  └─ OAuth2PasswordBearer security                      │
├─────────────────────────────────────────────────────────┤
│  Router Modules                                         │
│  ├─ /auth (login/token)                                │
│  ├─ /menu (CRUD + caching)                            │
│  ├─ /orders (lifecycle management)                     │
│  ├─ /admin (dashboard/controls)                        │
│  ├─ /payments (verification)                           │
│  ├─ /upload (file handling)                            │
│  ├─ /events (SSE streams)                              │
│  ├─ /branding (configuration)                          │
│  └─ /health (monitoring)                               │
├─────────────────────────────────────────────────────────┤
│  Business Logic                                         │
│  ├─ Server-side order validation                       │
│  ├─ Price calculation verification                     │
│  ├─ Shop status enforcement                            │
│  ├─ OTP generation/verification                        │
│  └─ Payment proof workflow                             │
└─────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER                            │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                    │
│  ├─ users (id, username, email, role, hashed_password) │
│  ├─ menu_items (id, name, price, category, image_url)  │
│  ├─ orders (id, user_id, status, total_amount, otp)    │
│  ├─ order_items (order_id, menu_item_id, quantity)     │
│  └─ settings (key-value store for shop status)         │
├─────────────────────────────────────────────────────────┤
│  Redis Cache & Pub/Sub                                 │
│  ├─ Menu caching (60s TTL)                            │
│  ├─ Rate limiting counters                             │
│  ├─ Real-time event publishing                         │
│  └─ Graceful degradation on failure                    │
├─────────────────────────────────────────────────────────┤
│  Cloudinary CDN                                         │
│  ├─ Menu item images                                    │
│  ├─ Payment proof screenshots                          │
│  └─ Branding assets                                     │
└─────────────────────────────────────────────────────────┘
```

### Authentication & Authorization
- **JWT Implementation**: HS256 algorithm with 5-hour expiry
- **Token Storage**: AsyncStorage on mobile with automatic injection
- **Role-Based Access**: Student/Admin roles with endpoint protection
- **Dependencies**: 
  - `get_current_active_user` for authenticated endpoints
  - `require_admin` for admin-only operations
- **Security**: bcrypt password hashing, automatic token refresh

### Order Management Workflow
```
1. Student: Browse Menu (cached, filtered)
   ↓
2. Student: Add to Cart (local state)
   ↓
3. Student: Place Order (server validation)
   ↓
4. System: Create Order with "Pending" status
   ↓
5. Student: Upload Payment Proof
   ↓
6. System: Update to "Pending_Verification"
   ↓
7. Admin: Review Payment Proof (zoomable)
   ↓
8. Admin: Approve → Generate OTP → "Paid" status
   ↓
9. Admin: Move to Kitchen → "Preparing" status
   ↓
10. Admin: Mark Ready → "Ready" status
    ↓
11. Student: Present OTP for Collection
    ↓
12. Admin: Verify OTP → "Completed" status
```

### Real-Time Communication
- **Server-Sent Events (SSE)**: `/events/orders/{user_id}` endpoint
- **Redis Pub/Sub Channels**:
  - `order_updates:{order_id}` - Order-specific updates  
  - `order_updates:user:{user_id}` - User-specific updates
  - `menu_updates` - Menu item changes
  - `shop_status` - Shop open/close broadcasts
- **Fallback Strategy**: Polling for clients without SSE support

### Caching Strategy
- **Menu Items**: 60-second TTL Redis cache with invalidation
- **Shop Status**: Cached with immediate invalidation on changes
- **Rate Limiting**: Redis counters with TTL expiration
- **Graceful Degradation**: System continues operating if Redis fails

### Rate Limiting Implementation
- **Per-User Limits**: JWT-extracted user_id for tracking
- **Endpoint Groups**: Different limits for order creation, menu reads, etc.
- **Global Safety Valve**: System-wide throttling under load
- **Anonymous Fallback**: IP-based limiting for unauthenticated requests

### Mobile App Architecture
```
App.tsx (Entry Point)
├─ AuthProvider (Context)
│   ├─ Token persistence (AsyncStorage)
│   ├─ JWT parsing for role extraction
│   └─ Auto-restore on app launch
├─ CartProvider (Context)
│   ├─ In-memory cart state
│   ├─ Add/remove/clear operations
│   └─ Real-time total calculation
└─ Navigation Logic
    ├─ Loading State (ActivityIndicator)
    ├─ Auth Gate (Login/Register)
    ├─ Role-based Routing
    │   ├─ Student Screens
    │   │   ├─ MenuScreen (browse/filter)
    │   │   ├─ CartScreen (review)
    │   │   ├─ PaymentScreen (proof upload)
    │   │   ├─ OrderStatusScreen (tracking)
    │   │   └─ OrderHistoryScreen
    │   └─ Admin Navigation
    │       ├─ AdminDashboardScreen
    │       ├─ AdminOrderListScreen
    │       ├─ PaymentVerificationScreen
    │       ├─ AdminMenuListScreen
    │       └─ AdminCollectionScreen
    └─ API Client Integration
        ├─ Automatic token injection
        ├─ 401 handling with logout
        └─ Error logging and retry
```

### Database Schema Implementation

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    role VARCHAR DEFAULT 'student',  -- 'student', 'admin', 'kitchen'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items Table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,  -- Stored in paisa (₹1 = 100)
    category VARCHAR NOT NULL,
    image_url VARCHAR,
    is_vegetarian BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT menu_item_price_positive CHECK (price >= 1)
);

-- Orders Table  
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR DEFAULT 'Pending',  -- Pending → Pending_Verification → Paid → Preparing → Ready → Completed
    payment_submitted BOOLEAN DEFAULT false,
    total_amount INTEGER NOT NULL,  -- Server-calculated total
    otp VARCHAR,  -- Generated by admin on payment verification
    verified_by VARCHAR,  -- Admin username who verified payment
    verification_proof VARCHAR,  -- Cloudinary URL for payment screenshot
    rejection_reason VARCHAR,  -- If payment rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT order_total_non_negative CHECK (total_amount >= 0)
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,  -- Price snapshot at order time
    CONSTRAINT order_item_quantity_positive CHECK (quantity >= 1),
    CONSTRAINT order_item_price_positive CHECK (price >= 0)
);

-- Settings Table (Key-Value store)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR UNIQUE NOT NULL,
    value VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Implementation Details

#### 1. **Error Handling & Resilience**
- **Redis Graceful Degradation**: System operates without Redis if unavailable
- **Database Connection Pooling**: SQLAlchemy session management
- **API Timeout Handling**: 10-second client-side timeouts
- **Validation**: Pydantic schemas for all API inputs/outputs
- **Business Rule Constraints**: Database-level CHECK constraints

#### 2. **Security Implementation**
- **Password Security**: bcrypt hashing (not Argon2 as initially planned)
- **JWT Security**: HS256 with configurable secret key
- **SQL Injection Prevention**: SQLAlchemy ORM parameterization
- **CORS Configuration**: Wildcard for development, restrictable for production
- **Rate Limiting**: Per-user and per-endpoint throttling

#### 3. **Performance Optimizations**
- **Menu Caching**: 60-second Redis cache with smart invalidation
- **Database Indexing**: Primary keys and unique constraints on lookup fields
- **Lazy Loading**: Order items loaded with relationships
- **Efficient Queries**: Bulk operations for order creation
- **Connection Management**: Proper session cleanup

#### 4. **Real-Time Features**
- **SSE Implementation**: Server-Sent Events for order updates
- **Pub/Sub Architecture**: Redis channels for event distribution
- **Connection Management**: Proper cleanup to prevent memory leaks
- **Fallback Strategy**: Polling mode when SSE unavailable

#### 5. **File Upload System**
- **Cloudinary Integration**: Direct upload for payment proofs
- **Image Validation**: URL format validation
- **Storage Organization**: Categorized by upload type
- **CDN Optimization**: Automatic image optimization

## 🟡 PARTIALLY IMPLEMENTED

### Mobile App Features
- **Student Registration**: Backend ready, UI implemented
- **Profile Management**: Basic structure, needs completion
- **Order History**: API endpoints exist, UI needs work
- **Push Notifications**: Infrastructure planned, not implemented

### Admin Features  
- **Analytics Dashboard**: Basic stats implemented, needs enhancement
- **Kitchen Management**: Order flow exists, dedicated kitchen view needed
- **Inventory Management**: Basic availability toggle, full inventory tracking needed

## ❌ PLANNED BUT NOT IMPLEMENTED

### Advanced Features
- **WebSocket Real-Time**: SSE implemented instead for simplicity
- **Advanced Reporting**: Analytics beyond basic counters
- **Multi-Restaurant Support**: Single restaurant focus
- **Delivery Integration**: Pickup-only model
- **Payment Gateway Integration**: Manual UPI screenshot workflow only

### Infrastructure
- **Container Deployment**: Direct server deployment used
- **CI/CD Pipeline**: Manual deployment process
- **Monitoring & Alerting**: Basic logging only
- **Load Balancing**: Single instance deployment

## 🔧 DEPLOYMENT CONFIGURATION

### Development Environment
- **Backend**: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Database**: Local PostgreSQL on port 5432
- **Redis**: Local Redis on port 6379 (optional)
- **Mobile**: React Native CLI with Metro bundler

### Production Environment  
- **Platform**: Render.com free tier
- **Region**: Singapore
- **Runtime**: Python with pip install
- **Environment Variables**: JWT secrets, database URL, API keys
- **Static Files**: Served directly by FastAPI

### Mobile Build Configuration
- **Target**: Android APK (React Native CLI)
- **Size Optimization**: Metro bundling with tree shaking
- **Release Builds**: Optimized with ProGuard
- **Hermes Engine**: Enabled for performance

This architecture represents a **production-ready, scalable system** built under strict constraints while maintaining modern development practices and architectural patterns.
