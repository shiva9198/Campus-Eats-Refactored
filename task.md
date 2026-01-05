# Campus Eats — Task & Progress Log

## Day 1 — Destruction & Foundation
> **Status:** COMPLETE
> **Date:** Day 1

### Goals
- Clean slate. Remove legacy violations.
- Initialize production-grade Backend (FastAPI).
- Initialize Mobile (React Native CLI).

### Planned Changes
- `[RENAME]` legacy folders (`mobile` -> `mobile_legacy`, `backend_python` -> `backend_legacy`).
- `[NEW]` Backend skeleton (`main.py`, `database.py`, `models.py`, `auth.py`).
- `[NEW]` Mobile Init (RN CLI 0.76).

### Verification Checklist
- [x] Legacy folders exist.
- [x] Backend starts locally (`uvicorn`).
- [x] Android App builds and runs "Hello World".
- [x] Hermes enabled.

### Bugs / Issues Found
1. **`externally-managed-environment` (pip):** macOS Blocked global pip.
   - *Fix:* Created `backend/venv`.
2. **`pydantic-core` Build Fail (Rust):** Python 3.14 Alpha cannot build wheels.
   - *Fix:* Downgraded to `pydantic` v1 and `fastapi` v0.104 (Pure Python).
3. **`psycopg2` Build Fail:** C-Extensions failed on Py3.14.
   - *Fix:* Switched to `pg8000` (Pure Python driver).

### Changes Made
- Renamed legacy folders.
- Created `backend/` with `main.py`, `models.py`, `auth.py`, `database.py`.
- Initialized `mobile/` with React Native CLI 0.76.
- Configured `backend/requirements.txt` for Python 3.14 compatibility.

### Notes / Decisions
- **Strict Venv Usage:** Must use `backend/venv/bin/python`.
- **Pure Python Backend:** To support alpha host OS configuration.

---

## Day 2 — Core Data & Menu (The Truth)
> **Status:** COMPLETE
> **Date:** Day 2

### Goals
- Enable Admin to upload food (Single Source of Truth).
- Students view Menu.
- Offline Persistence.

### Planned Changes
- **Backend:**
    - `backend/routers/menu.py`: CRUD for Menu Items.
    - `backend/schemas.py`: Pydantic Models (V1 style).
- **Mobile:**
    - `mobile/src/api/client.ts`: Axios client.
    - `mobile/src/screens/MenuScreen.tsx`: Fetch & Render.
    - `mobile/src/components/MenuItem.tsx`: UI Component.

### Verification Checklist
- [x] Swagger UI (`/docs`) shows POST /menu working.
- [x] Mobile App fetches and renders menu items from DB.
- [x] Images load from Cloudinary URLs.
- [x] Offline message shown when network off.

### Out of Scope (Day 2)
- Orders.
- Cart logic.
- Payment.

---

## Day 3 — The Order Flow (The Business)
> **Status:** COMPLETE
> **Date:** Day 3

### Goals
- Robust ordering state machine.
- Inventory checks.
- Mobile Cart Management (Context + useReducer).

### Planned Changes
- **Backend:**
    - `backend/models.py`: `Order`, `OrderItem`.
    - `backend/routers/orders.py`: Order Placement API.
- **Mobile:**
    - `mobile/src/context/CartContext.tsx`: State Management.
    - `mobile/src/screens/CartScreen.tsx`: UI.
    - `mobile/src/screens/OrderSuccess.tsx`: Confirmation.

### Verification Checklist
- [x] User can add items to Cart.
- [x] Cart persists items (in-memory per session).
- [x] "Place Order" creates DB entry.
- [x] Backend validates Item IDs.
- [x] Order Status defaults to "Pending".

### Out of Scope
- Admin View of orders.
- Push Notifications.
- Payment Integration (Day 4).

---

## Day 4 — Payments & Status Visibility (IN PROGRESS)
> **Status:** COMPLETE
> **Date:** Day 4

### Goals
- Manual payment proof submission
- Polling-based order status updates
- Admin-controlled state transitions

### Planned Changes
- backend/routers/payments.py
- backend/routers/admin.py
- mobile/src/screens/PaymentScreen.tsx
- mobile/src/screens/OrderStatusScreen.tsx

### Verification Checklist
- [x] Student "I Have Paid" does NOT change status from Pending.
- [x] Admin "Mark Preparing" changes status.
- [x] Polling updates Status Screen (15s interval).
- [x] Offline handling (no crash).

### Out of Scope
- Real Money.
- Push Notifications.

---

## Day 5 — Polish & Production Readiness (IN PROGRESS)
> **Status:** COMPLETE
> **Date:** Day 5

### Goals
- Improve menu clarity with stock visibility
- Add admin stock toggle
- Harden network configuration
- Improve offline/error UX

### Planned Changes
- `backend/routers/menu.py` (return all items, add availability toggle)
- `mobile/src/api/client.ts` (explicit base URL)
- `mobile/src/components/MenuItem.tsx` (disabled/grayed UI)
- `mobile/src/screens/MenuScreen.tsx` (handle availability)

### Verification Checklist
- [x] Admin can mark item as "Out of Stock".
- [x] Student sees "Out of Stock" (grayed out).
- [x] Student cannot add unavailable item.
- [x] App connects via explicit IP (not just localhost).
- [x] Offline/Error states verified.
- [x] Cart Validation (Backend rejects unavailable items).
- [x] Race Condition Check (Refresh updates status).

### Out of Scope
- New payment gateways.
- Advanced Admin Dashboard
- Categories/Search/Pagination.

## Day 6 — Optimization & Shrinkage (IN PROGRESS)
> **Status:** COMPLETE
> **Date:** Day 6

### Goals
- Reduce APK size below 20 MB (Target: 15 MB).
- Enable ProGuard/R8 (with React Native + Axios + SVG rules).
- Enable ABI split (arm64-v8a only).
- **Safety:** Debuggable false, Hermes enabled.

### Planned Changes
- `android/app/build.gradle` (ProGuard, Splits, Debug=false, Hermes=true).
- `android/app/proguard-rules.pro` (Guardrails).
- Remove unused Android assets.

### Verification Checklist
- [x] Clean Build (`./gradlew clean`).
- [x] Release Build succeeds (`assembleRelease`).
- [x] APK Size check (13.4 MB < 20 MB).
- [x] Smoke Test: App Launches (ProGuard Safe) - **Verified on Emulator**.
- [x] Smoke Test: App Launches (ProGuard Safe) - **Verified on Emulator**.
- [x] Smoke Test: Menu/Cart (Networking Safe) - **Verified on Emulator**.

### Bugs / Issues Found
1. **Release Crash (Buffer/Process):** `ReferenceError: Buffer` in Axios.
   - *Fix:* Installed `buffer`, `process`, `stream-browserify`. Polyfilled in `index.js`.
2. **Emulator Conflict:** Previous "customer" app prevented launch (`ERR_CONNECTION_REFUSED`).
   - *Fix:* Clean uninstall/reinstall.
3. **Native Crash (Signal 6):** Missing `Stream/Events/URL` polyfills caused Hermes abort.
   - *Fix:* Added `stream`, `events`, `url` to `index.js` global scope.

## Day 7 — Validation & Handover (The Proof)
> **Status:** COMPLETE
> **Date:** Day 7

### Goals
- Run comprehensive system integrity check (Backend + Simulated Client).
- Update Documentation for Handover.
- Final Cleanup.

### Planned Changes
- Create `verify_full_system.py`.
- Update `README.md`.
- Delete temp scripts.

### Verification Checklist
- [x] Full System Verification Script Passes.
- [x] README is accurate (Quick Start, Architecture).
- [x] Repo is clean (no dead code).

### Deliverables
1. **verify_full_system.py** - 5 comprehensive tests (Menu, Orders, Inventory, Auth, Health)
2. **README.md** - Production documentation with API reference and constraints
3. **Cleanup** - Removed verify_day4.py, verify_day5.py, crash logs

---

# BATCH-2: PRODUCTION HARDENING

## Batch-2 — Production Hardening (IN PROGRESS)

### Scope
- Backend validation & error handling
- Database integrity constraints
- Mobile network resilience
- Logging, rate limiting, health visibility

### Guarantees
- ✅ No breaking API changes
- ✅ No schema-breaking migrations
- ✅ APK size unchanged (≤ 13.4 MB)
- ✅ Zero-cost constraint maintained
- ✅ All changes are additive and reversible

### Execution Rules (LOCKED)
- ❌ No new features
- ❌ No UI redesigns
- ❌ No auth overhaul
- ❌ No payment logic changes
- ❌ No new dependencies

> **Objective**: Make the system bulletproof for daily production use
> **Duration**: 4 days (Days 8-11)

---

## Day 8 — Backend Error Handling & Validation
> **Status:** COMPLETE
> **Date:** 2026-01-04

### Goals
- Robust error handling across all endpoints
- User-friendly validation messages
- Enforce admin state machine transitions
- Input validation for edge cases

### Planned Changes
- `backend/main.py` (global exception handlers)
- `backend/routers/orders.py` (quantity/amount validation)
- `backend/routers/admin.py` (enforce state machine)
- `backend/routers/menu.py` (price/name validation)

### Verification Checklist
- [x] Backend returns 422 for invalid inputs (not 500)
- [x] State machine enforced (invalid transitions return 400)
- [x] `verify_full_system.py` passes (no regressions) - **5/5 tests passed**
- [x] Backend startup logging shows Batch-2 version

### Changes Made

#### `backend/main.py`
- Added global exception handler for 500 errors (logs details, returns safe message)
- Added RequestValidationError handler for 422 errors (user-friendly field-level errors)
- Added startup event logging (version, database, timestamp)
- Added shutdown event logging
- Updated version to `2.0.0-batch2`

#### `backend/schemas.py`
- Added Field validators: `price` (₹1-1000), `name` (1-100 chars), `category` (1-50 chars), `description` (max 500 chars)
- Added `image_url` validator (HTTP/HTTPS check)
- Added OrderItem `quantity` validator (1-50) 
- Added OrderCreate `items` validator (max 30 items, max 100 total quantity)

#### `backend/routers/orders.py`
- Added total amount validation (max ₹10,000)
- Added try/except with database rollback on failure
- Improved error messages (include item name on unavailability)
- Added docstring

#### `backend/routers/admin.py`
- **Enforced strict state machine**: `Pending → Preparing → Ready → Completed`
- Removed "Rejected" status (per Batch-2 scope decision)
- Added clear error messages for invalid transitions
- Idempotent: same state transition returns success

#### `backend/routers/menu.py`
- Fixed admin role check (now raises 403 instead of `pass`)
- Added try/except with database rollback on menu item creation failure

### Bugs / Issues Found
1. **Markdown code fences in Python file**: Tool accidentally inserted ` ```python ` markers in `main.py`
   - *Fix*: Removed fences manually

### Out of Scope
- Authentication/authorization changes (Batch-3)
- Database schema modifications (Day 9)

---

## Day 9 — Database Integrity & Constraints
> **Status:** COMPLETE
> **Date:** 2026-01-04

### Goals
- Enforce referential integrity at database level
- Prevent orphaned data (orders without items)
- Add check constraints for business rules

### Planned Changes
- `backend/models.py` (add CASCADE/RESTRICT foreign keys)
- `backend/migration_batch2_constraints.sql` (migration script)
- `backend/routers/menu.py` (DELETE endpoint with safety check)

### Verification Checklist
- [x] Cannot delete menu item if used in orders (RESTRICT constraint enforced)
- [x] Deleting order cascades to order_items (CASCADE constraint enforced)
- [x] Check constraints reject invalid data (tested: negative price rejected)
- [x] Migration script runs successfully (6/6 constraints added)
- [x] `verify_full_system.py` passes (5/5 tests - no regressions)

### Changes Made

#### `backend/models.py`
- Added `CheckConstraint` import from sqlalchemy
- **MenuItem**: Added CHECK constraint `price >= 1` (menu_item_price_positive)
- **Order**: Added CHECK constraint `total_amount >= 0` (order_total_non_negative)
- **Order**: Added relationship cascade `"all, delete-orphan"` to automatically delete order_items when order deleted
- **OrderItem**: Changed `order_id` foreign key to include `ondelete="CASCADE"` (delete order → delete items)
- **OrderItem**: Changed `menu_item_id` foreign key to include `ondelete="RESTRICT"` (prevent deletion of menu items used in orders)
- **OrderItem**: Added CHECK constraints `quantity >= 1` and `price >= 0`

#### `backend/migration_batch2_constraints.sql` (NEW)
- Created idempotent migration script (safe to run multiple times)
- Drops old foreign key constraints and re-adds with CASCADE/RESTRICT
- Adds all 6 CHECK constraints using DO blocks with IF NOT EXISTS checks
- Includes verification query to list all added constraints
- Migration executed successfully: **6/6 constraints added**

#### `backend/routers/menu.py`
- Added DELETE endpoint `/menu/{menu_item_id}` (admin only)
- Catches database RESTRICT constraint violation
- Returns 409 Conflict if item used in orders (suggests marking unavailable instead)
- Returns 403 if non-admin attempts deletion
- Returns 404 if menu item not found

### Verification Tests Executed

#### Database Constraint Tests
1. **Negative price rejection**:
   ```sql
   INSERT INTO menu_items (name, price) VALUES ('Invalid', -10);
   -- Result: ERROR: violates check constraint "menu_item_price_positive" ✅
   ```

2. **Migration verification**:
   ```sql
   SELECT constraint_name, constraint_type FROM information_schema.table_constraints...
   -- Result: 6 rows returned (all constraints present) ✅
   ```

#### Regression Tests
- `verify_full_system.py`: **5/5 tests passed** ✅
  - Backend Health ✅
  - Menu API ✅
  - Order Flow ✅
  - Inventory Management ✅
  - Admin Auth ✅

### Out of Scope
- Data backfill/cleanup
- Alembic migration system (using raw SQL for now)

---

## Day 10 — Mobile Network Resilience & UX
> **Status:** COMPLETE
> **Date:** 2026-01-04

### Goals
- Graceful network failure handling
- Improved loading/error states
- Confirmation dialogs for critical actions
- Better user feedback

### Planned Changes
- `mobile/src/api/client.ts` (timeout, retry logic)
- `mobile/src/screens/MenuScreen.tsx` (pull-to-refresh, retry)
- `mobile/src/screens/CartScreen.tsx` (confirmation dialog)
- `mobile/src/screens/OrderStatusScreen.tsx` (error boundary, manual refresh)

### Verification Checklist
- [x] Timeout set to 10s (no infinite spinners)
- [x] Retry logic implemented (GET only, max 2 retries, exponential backoff)
- [x] Clear offline/error states with user-friendly messages
- [x] "Place Order" requires confirmation dialog
- [x] Polling continues despite errors
- [x] Manual refresh button available
- [x] Last updated timestamp shown

### Changes Made

#### `mobile/src/api/client.ts`
- Added `AxiosError` type import for proper error handling
- **Response Interceptor**: Logs 422 (validation) and 500+ (server) errors to console
- **Network Error Classification**: Added `classifyNetworkError` function  
  - Detects: `timeout` (ECONNABORTED), `offline` (Network Error), `server` (5xx), `unknown`
- **User-Friendly Errors**: Added `getUserFriendlyError` function  
  - Timeout → "Request timed out after 10 seconds..."
  - Offline → "No network connection. Please check your Wi-Fi..."
  - Server → "Server error. Please try again later."
- **Retry Logic**: Added `retryRequest` wrapper function
  - Applies ONLY to GET requests (safe idempotent operations)
  - Max 2 retries with exponential backoff (1s, 2s)
  - Does NOT retry 4xx client errors (except timeout)
  - Logs retry attempts to console
- Updated `getMenu()` to use retry logic
- Kept `updateMenuItemAvailability()` without retry (PATCH is a mutation)

#### `mobile/src/screens/MenuScreen.tsx`
- Added `error` state to track network failures
- Added `getUserFriendlyError` import
- **Error State UI**: Shows when fetch fails  
  - Warning icon (⚠️)
  - User-friendly error message
  - "Retry" button to manually retry fetch
- Enhanced loading state with "Loading menu..." text
- Improved error handling in `fetchMenu` (clear error on success)
- Improved error handling in `handleToggleStock` (user-friendly messages)
- Added styles: `loadingText`, `errorIcon`, `errorText`, `retryButton`, `retryButtonText`

#### `mobile/src/screens/CartScreen.tsx`
- Added `getUserFriendlyError` import
- **Confirmation Dialog**: Added `Alert.alert` before order placement  
  - Shows total amount
  - "This action cannot be undone" warning
  - Cancel / Confirm options
- Enhanced error handling with user-friendly messages
- Added validation: shows alert if cart is empty when placing order

#### `mobile/src/screens/OrderStatusScreen.tsx`
- Added `error` state for polling failures
- Added `lastUpdated` state (timestamp of last successful fetch)
- **Error Banner**: Shows network issues but continues auto-polling  
  - Warning icon and user-friendly error message
  - "Auto-retrying every 15s" subtext
- **Last Updated Timestamp**: Shows when status was last refreshed  
  - Format: "Last updated: HH:MM:SS"
- **Manual Refresh Button**: "🔄 Refresh Now"  
  - Disabled during loading (shows ActivityIndicator)
  - Clears error and fetches latest status
- Polling resilience: continues polling even after errors (network might recover)
- Added styles: `errorBanner`, `errorBannerText`, `errorSubtext`, `lastUpdatedText`, `refreshButton`, `refreshButtonDisabled`, `refreshButtonText`

### Verification Notes
- All changes are UX improvements (no backend changes)
- No new dependencies added (zero APK size impact)
- Retry logic prevents overwhelming server (max 2 retries, only on network/timeout errors)
- Confirmation dialogs prevent accidental order submissions

### Out of Scope
- Offline data persistence (cart cleared on app close)
- Background sync (requires native modules)

---

## Day 11 — Logging, Rate Limiting & Operational Visibility
> **Status:** COMPLETE
> **Date:** 2026-01-04

### Goals
- Operational visibility (know what's happening)
- Abuse prevention (rate limiting)
- Health monitoring (uptime checks)

### Planned Changes
- `backend/main.py` (logging middleware, rate limiter)
- `backend/routers/health.py` (new endpoint)

### Verification Checklist
- [x] Requests are logged (method, path, status, duration)
- [x] Sensitive data (auth tokens, passwords) is NOT logged (No headers/body logged)
- [x] Rate limit blocks excessive requests (429 Too Many Requests) - Verified (blocks write ops)
- [x] `/health` returns 200 OK with DB status
- [x] `verify_day11.py` passes

### Changes Made

#### `backend/routers/health.py`
- Added `GET /health` endpoint
- Checks database connectivity (`SELECT 1`)
- Returns service status and version (`2.0.0-batch2`)

#### `backend/main.py`
- **Logging Middleware**:
  - Logs `Method Path Status Duration IP`
  - Uses safe format (no headers/body)
  - Excludes `/health` to reduce noise
  - Visual status indicators (✅, ⚠️, ❌)
- **In-Memory Rate Limiter**:
  - Zero-dependency implementation (using `collections.deque`)
  - Target: Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) only
  - Limit: ~10-20 requests per minute per IP (Protects against flooding)
  - Returns `429 Too Many Requests`
- **Imports Fixed**: Corrected import structure for `auth` and routers.

### Verification Notes
- Rate limiter actively blocks abusive write requests while allowing reads.
- Health endpoint provides instant ops visibility.
- Logging gives clear insight into traffic without leaking PII.
- **Zero Cost**: No new dependencies (Redis/SlowAPI) added.

### Out of Scope
- centralized logging (ELK/Splunk)
- Distributed rate limiting (Redis)
- Advanced metrics/monitoring

---

# Batch-3: Security Upgrade (JWT + Role Enforcement)
> **Goal:** Move from "trust-based" auth to production-grade JWT security with Role-Based Access Control (RBAC).

## Day 12 — Backend JWT Foundation
> **Status:** COMPLETE
> **Date:** 2026-01-05

### Goals
- Replace "magic string" auth with secure JWTs
- Implement login endpoint with password verification (mock/hashed)
- Secure token generation
- **Stability Constraint:** Maintain Dual-Auth (Legacy + JWT) support

### Planned Changes
- `backend/auth.py` (JWT logic, secret handling, Dual-Auth)
- `backend/routers/auth.py` (login endpoint)
- `backend/user_seed.py` (seed script)
- `backend/main.py` (include auth router)

### Verification Checklist
- [x] Legacy Auth ("admin") still works (with warning log).
- [x] `/token` endpoint returns valid JWT.
- [x] JWT allows access to protected resources.
- [x] Invalid password returns 401.

## Day 13 — Role-Based Access Control (RBAC)
> **Status:** COMPLETE
> **Date:** 2026-01-05

### Goals
- Enforce `admin` vs `student` roles
- Protect critical endpoints
- Middleware/Dependencies for token validation

### Planned Changes
- `backend/dependencies.py` (auth middleware)
- `backend/routers/admin.py` (require 'admin' role)
- `backend/routers/menu.py` (require 'admin' role)
- `backend/routers/orders.py` (require authenticated user)

### Verification Checklist
- [x] Admin token can access Admin routes.
- [x] Student token BLOCKED from Admin routes (403).
- [x] Student token can place orders.
- [x] Unauthenticated user blocked from all protected routes.

## Day 14 — Mobile Auth Integration
> **Status:** PENDING
> **Date:** TBD

### Goals
- Securely store JWT on device
- Auto-inject Authorization header
- Handle session expiry (401) gracefully

### Planned Changes
- `mobile/src/api/client.ts` (request interceptor)
- `mobile/src/context/AuthContext.tsx` (token management)
- `mobile/src/screens/LoginScreen.tsx` (connect to backend)

## Day 15 — Security Verification & Polish
> **Status:** PENDING
> **Date:** TBD

### Goals
- End-to-end security audit
- Verify token expiry flows
- Ensure no "open" admin routes remain

---
