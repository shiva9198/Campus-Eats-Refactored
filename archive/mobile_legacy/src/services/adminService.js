import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query, ID } from 'react-native-appwrite';

export const adminService = {
    /**
     * Get dashboard statistics
     * @returns {Object} Dashboard stats (pending payments, active orders, revenue, etc.)
     */
    getDashboardStats: async () => {
        try {
            // Fetch pending payments
            const pendingReq = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.equal('status', 'pending_verification')]
            );

            // Fetch active orders
            const activeReq = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.equal('status', ['preparing', 'ready', 'paid'])]
            );

            // Calculate total revenue (from all completed orders)
            const completedReq = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.equal('status', ['collected', 'completed'])]
            );

            const totalRevenue = completedReq.documents.reduce(
                (sum, order) => sum + (order.amount || 0),
                0
            );

            return {
                pendingPayments: pendingReq.total || 0,
                activeOrders: activeReq.total || 0,
                totalRevenue,
                orderCount: completedReq.total || 0
            };
        } catch (error) {
            console.error('getDashboardStats error:', error);
            throw error;
        }
    },

    /**
     * Get global settings (logo, UPI ID, etc.)
     * @returns {Object} Settings document
     */
    getGlobalSettings: async () => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SETTINGS,
                [Query.limit(1)]
            );

            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error('getGlobalSettings error:', error);
            throw error;
        }
    },

    /**
     * Update global settings
     * @param {Object} settings - Settings to update (logoUrl, upi_id, etc.)
     * @returns {Object} Updated settings document
     */
    updateGlobalSettings: async (settings) => {
        try {
            // Get existing settings document
            const existing = await adminService.getGlobalSettings();

            if (existing) {
                // Update existing document
                return await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.SETTINGS,
                    existing.$id,
                    {
                        ...settings,
                        updatedAt: Math.floor(Date.now() / 1000)
                    }
                );
            } else {
                // Create new settings document
                return await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.SETTINGS,
                    ID.unique(),
                    {
                        ...settings,
                        createdAt: Math.floor(Date.now() / 1000)
                    }
                );
            }
        } catch (error) {
            console.error('updateGlobalSettings error:', error);
            throw error;
        }
    },

    /**
     * Get all promotional offers
     * @returns {Object} List of offers
     */
    getOffers: async () => {
        try {
            return await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.OFFERS,
                [Query.orderDesc('$createdAt')]
            );
        } catch (error) {
            console.error('getOffers error:', error);
            throw error;
        }
    },

    /**
     * Create a new promotional offer
     * @param {Object} data - Offer data (title, subtitle, imageUrl, link)
     * @returns {Object} Created offer document
     */
    createOffer: async (data) => {
        try {
            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.OFFERS,
                ID.unique(),
                {
                    ...data,
                    createdAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('createOffer error:', error);
            throw error;
        }
    },

    /**
     * Delete a promotional offer
     * @param {string} offerId - Offer document ID
     * @returns {Object} Deletion response
     */
    deleteOffer: async (offerId) => {
        try {
            return await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.OFFERS,
                offerId
            );
        } catch (error) {
            console.error('deleteOffer error:', error);
            throw error;
        }
    },

    /**
     * Set shop status (open/closed)
     * @param {boolean} isOpen - Whether shop is open
     * @returns {Object} Updated settings
     */
    setShopStatus: async (isOpen) => {
        try {
            return await adminService.updateGlobalSettings({
                shopOpen: isOpen
            });
        } catch (error) {
            console.error('setShopStatus error:', error);
            throw error;
        }
    }
};
