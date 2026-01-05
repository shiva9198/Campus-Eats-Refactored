# Feature Parity Matrix

**Source of Truth:** `mobile_legacy` & `backend_legacy`
**Target:** `mobile` & `backend`

## 📊 Summary
- **Student Features:** ~40% Implemented (Missing Profile, Register, History, Notifications, Payment Proof)
- **Admin Features:** 0% Implemented (Missing Dashboard, Manual Verification, Settings, Analytics)
- **Backend Logic:** ~20% Implemented (Missing Payment Mode, Screenshot Uploads, OTP, Encryption, Analytics)

**Is it safe to delete the Old Project?**
⛔ **ABSOLUTELY NOT.** The new project is currently a "Happy Path" prototype compared to the production-grade Legacy system.

## A. Student Features

| Feature Name | Description | Exists in Old Project | Exists in New Backend | Exists in New Mobile UI | Notes |
|-------------|-------------|----------------------|----------------------|-------------------------|------|
| **Authentication** | Login | ✅ | ✅ | ✅ | New uses JWT, Old used Appwrite/Custom |
| **Registration** | Sign up new account | ✅ | ❌ | ❌ | |
| **Profile** | View Profile | ✅ | ❌ | ❌ | |
| **Edit Profile** | Update details | ✅ | ❌ | ❌ | |
| **Menu View** | Browse items | ✅ | ✅ | ✅ | |
| **Cart** | Add/Remove/Update items | ✅ | ✅ | ✅ | |
| **Place Order** | Checkout | ✅ | ✅ | ✅ | |
| **Payment Mode** | Gateway vs Manual Toggle | ✅ | ❌ | ❌ | Old allowed dynamic switching |
| **Payment Proof** | Upload Screenshot | ✅ | ❌ | ❌ | Critical for manual verification |
| **Order History** | View past orders | ✅ | ❌ | ❌ | |
| **Order Tracking** | Real-time status | ✅ | ✅ (Polling) | ✅ (Polling) | Old used WebSockets |
| **Notifications** | Push/In-app alerts | ✅ | ❌ | ❌ | |

## B. Admin Features

| Feature Name | Description | Exists in Old Project | Exists in New Backend | Exists in New Mobile UI | Notes |
|-------------|-------------|----------------------|----------------------|-------------------------|------|
| **Dashboard** | Stats/Charts/Analytics | ✅ | ❌ | ❌ | Old had Sales/Popular Items/Order Counts |
| **Order List** | View all orders | ✅ | ✅ (API only) | ❌ | |
| **Order Details** | View specific order | ✅ | ✅ (API only) | ❌ | |
| **Update Status** | Accept/Reject/Ready | ✅ | ✅ (API only) | ❌ | |
| **Payment Verification** | List pending payments | ✅ | ❌ | ❌ | Core workflow feature |
| **Verify Payment** | Approve + OTP Generation | ✅ | ❌ | ❌ | Old backend generated OTP on approval |
| **Reject Payment** | Rejection with Reason | ✅ | ❌ | ❌ | |
| **Menu Management** | List items | ✅ | ✅ (API only) | ❌ | |
| **Edit Menu** | Update price/stock | ✅ | ✅ (API only) | ❌ | New has basic Stock Toggle |
| **Settings** | Dynamic Config | ✅ | ❌ | ❌ | Old allowed changing UPI ID/Gateway keys runtime |
| **Shop Status** | Open/Close Shop | ✅ | ❌ | ❌ | Old broadcasted closed status to apps |
| **Security** | Encrypted Settings | ✅ | ❌ | ❌ | Old encrypted API keys in DB |

## C. Backend / Business Logic

| Feature Name | Description | Exists in Old Project | Exists in New Backend | Exists in New Mobile UI | Notes |
|-------------|-------------|----------------------|----------------------|-------------------------|------|
| **WebSocket** | Real-time updates | ✅ | ❌ | ❌ | New uses SSE/Polling (Constraint: SSE per prompt) |
| **Cloudinary** | Image Uploads | ✅ | ❌ | ❌ | Needed for Menu & Pay Proof |
| **Appwrite** | BaaS | ✅ | ❌ | ❌ | Replaced by FastAPI/SQL |
| **Push Notif** | Expo Push | ✅ | ❌ | ❌ | |
| **Encryption** | Encrypt sensitive settings | ✅ | ❌ | ❌ | `backend_legacy/app/services/encryption.py` |
| **Webhooks** | Razorpay Handling | ✅ | ❌ | ❌ | `payments.py` has webhook logic |
