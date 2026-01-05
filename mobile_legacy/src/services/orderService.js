import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query } from 'react-native-appwrite';

export const orderService = {
    /**
     * Search for an order by OTP code
     * @param {string} otp - 6-digit OTP code
     * @returns {Object|null} Order document or null if not found
     */
    searchOrderByOtp: async (otp) => {
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
                Query.equal('otp', otp),
                Query.notEqual('status', 'collected')
            ]);
            return res.documents.length > 0 ? res.documents[0] : null;
        } catch (error) {
            console.error('searchOrderByOtp error:', error);
            throw error;
        }
    },

    /**
     * Update order status with optional metadata
     * @param {string} orderId - Order document ID
     * @param {string} status - New status
     * @param {Object} metadata - Additional fields to update
     * @returns {Object} Updated order document
     */
    updateStatus: async (orderId, status, metadata = {}) => {
        try {
            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
                status,
                updatedAt: Math.floor(Date.now() / 1000),
                ...metadata
            });
        } catch (error) {
            console.error('updateStatus error:', error);
            throw error;
        }
    },

    /**
     * Get orders filtered by category (active or completed)
     * @param {string} category - 'active' or 'completed'
     * @returns {Object} List of orders
     */
    getOrdersByStatus: async (category) => {
        try {
            let queries = [Query.orderDesc('$createdAt')];
            if (category === 'active') {
                queries.push(Query.equal('status', ['paid', 'preparing', 'ready']));
            } else {
                queries.push(Query.equal('status', ['completed', 'collected', 'rejected', 'cancelled']));
            }
            return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, queries);
        } catch (error) {
            console.error('getOrdersByStatus error:', error);
            throw error;
        }
    },

    /**
     * Get pending payment orders
     * @returns {Object} List of orders pending verification
     */
    getPendingPayments: async () => {
        try {
            return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
                Query.equal('status', 'pending_verification'),
                Query.orderDesc('$createdAt')
            ]);
        } catch (error) {
            console.error('getPendingPayments error:', error);
            throw error;
        }
    },

    /**
     * Verify payment and generate OTP
     * @param {string} orderId - Order document ID
     * @param {string} verifiedBy - Admin email/name
     * @returns {Object} Updated order with OTP
     */
    verifyPayment: async (orderId, verifiedBy) => {
        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const now = Math.floor(Date.now() / 1000);

            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
                status: 'paid',
                verifiedBy,
                verifiedAt: now,
                otp,
                qrUsed: false,
                readyToCollect: false,
                updatedAt: now
            });
        } catch (error) {
            console.error('verifyPayment error:', error);
            throw error;
        }
    },

    /**
     * Reject payment with reason
     * @param {string} orderId - Order document ID
     * @param {string} rejectedBy - Admin email/name
     * @param {string} reason - Rejection reason
     * @returns {Object} Updated order
     */
    rejectPayment: async (orderId, rejectedBy, reason) => {
        try {
            const now = Math.floor(Date.now() / 1000);

            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
                status: 'rejected',
                rejectedBy,
                rejectedAt: now,
                rejectReason: reason,
                updatedAt: now
            });
        } catch (error) {
            console.error('rejectPayment error:', error);
            throw error;
        }
    },

    /**
     * Mark order as collected
     * @param {string} orderId - Order document ID
     * @returns {Object} Updated order
     */
    markAsCollected: async (orderId) => {
        try {
            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
                status: 'collected',
                updatedAt: Math.floor(Date.now() / 1000)
            });
        } catch (error) {
            console.error('markAsCollected error:', error);
            throw error;
        }
    }
};
