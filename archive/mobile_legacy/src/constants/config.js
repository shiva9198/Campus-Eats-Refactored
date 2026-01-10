
// Centralized API Configuration
// Switch this URL based on environment (Dev vs Prod)

// Local Development
// export const API_BASE_URL = 'http://localhost:8000';

// Production / Deployed Backend
export const API_BASE_URL = 'https://campus-eats-backend-a7f4.onrender.com';

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        SEND_OTP: '/auth/send-otp',
        VERIFY_OTP: '/auth/verify-otp',
    },
    ORDERS: {
        CREATE: '/orders/', // Updated to match backend
        UPDATE_STATUS: (orderId) => `/orders/${orderId}/status`,
        MY_ORDERS: (userId) => `/orders/my-orders/${userId}`,
    },
    PAYMENTS: {
        MODE: '/payments/mode',
        SET_MODE: '/payments/mode', // Added missing endpoint
        VERIFY_MANUAL: '/payments/verify-manual',
        REJECT: '/payments/reject',
    },
    ADMIN: {
        ANALYTICS: '/admin/analytics',
        POPULAR_ITEMS: '/admin/analytics/popular-items',
        SALES: '/admin/analytics/sales',
    },
    MENU: {
        LIST: '/menu/',
    }
};
