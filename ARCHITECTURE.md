# System Architecture & Status

> [!IMPORTANT]
> This document strictly separates **Fact (Implemented)** from **Fiction (Planned)**.
> DO NOT move items to "Implemented" until they are verified in production code.

## ✅ IMPLEMENTED (Current Reality)

### Core Technology
- **Mobile**: React Native (Expo SDK 50), JavaScript/TypeScript.
- **Backend**: FastAPI (Python 3.12).
- **Database**: PostgreSQL (SQLAlchemy ORM).
- **Storage**: Cloudinary (Image hosting).
- **Auth**: JWT-based Authentication with Role-Based Access Control (RBAC).

### Key Features
#### 1. Authentication & Users
- **Roles**: Student, Admin.
- **Flow**: Login, Register (Student), Logout.
- **Security**: Password hashing (Argon2), Token expiry.

#### 2. Menu Management
- **View**: List view with Search, Veg/Non-Veg Filters, and Category Chips (Composite Filtering).
- **Admin**: Create, Edit, Delete, Toggle Availability.
- **Data**: Dynamic categories derived from items.

#### 3. Ordering System
- **Lifecycle**: `Pending` -> `Pending_Verification` -> `Paid` -> `Preparing` -> `Ready` -> `Completed`.
- **Validation**: Server-side price calculation, Availability checks.
- **Payment Trust**:
  - Image Upload for Payment Proof.
  - Admin Payment Verification Screen (Zoomable proof, Approve/Reject logic).
  - OTP Generation upon verification.
  - Shop Open/Close Logic (Hard block on new orders when closed).

#### 4. Admin Dashboard
- **Stats**: Daily Revenue, Order Counts (Pending, Active).
- **Controls**: Shop Open/Close Toggle (Global Setting).
- **Visibility**: Shop Status Indicator in Header.

## 🟡 PLANNED (Future)

- **Notifications**: Push notifications for "Order Ready" or "Payment Verified".
- **Kitchen View**: Dedicated KDS (Kitchen Display System) for kitchen staff (currently Admin handles this).
- **Profile Management**: Profile picture upload, Password reset.

## ❌ OUT OF SCOPE (Explicitly Rejected)

- **Delivery Tracking**: No map-based tracking or rider assignment.
- **In-App Wallet**: No stored balance or refund wallet.
- **Chat Support**: No in-app chat with admin/kitchen.
- **3rd Party Gateways**: No Razorpay/Stripe integration (Manual UPI Screenshot flow only).
