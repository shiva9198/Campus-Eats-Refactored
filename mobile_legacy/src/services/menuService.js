import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID } from './appwrite';
import { ID, Query } from 'react-native-appwrite';

export const menuService = {
    /**
     * Get all menu items
     * @returns {Object} List of menu items
     */
    getMenuItems: async () => {
        try {
            return await databases.listDocuments(DATABASE_ID, COLLECTIONS.MENU_ITEMS, [
                Query.limit(100)
            ]);
        } catch (error) {
            console.error('getMenuItems error:', error);
            throw error;
        }
    },

    /**
     * Create a new menu item with optional image upload
     * @param {Object} data - Menu item data (name, price, category, etc.)
     * @param {Object} imageFile - Optional image file object
     * @returns {Object} Created menu item document
     */
    createMenuItem: async (data, imageFile = null) => {
        try {
            let imageUrl = data.imageUrl || '';

            // Upload image to storage if provided
            if (imageFile) {
                const file = await storage.createFile(BUCKET_ID, ID.unique(), imageFile);
                imageUrl = storage.getFileView(BUCKET_ID, file.$id).href;
            }

            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                ID.unique(),
                {
                    ...data,
                    imageUrl,
                    available: true,
                    createdAt: Math.floor(Date.now() / 1000)
                }
            );
        } catch (error) {
            console.error('createMenuItem error:', error);
            throw error;
        }
    },

    /**
     * Update an existing menu item
     * @param {string} itemId - Menu item document ID
     * @param {Object} data - Updated data
     * @param {Object} imageFile - Optional new image file
     * @returns {Object} Updated menu item document
     */
    updateMenuItem: async (itemId, data, imageFile = null) => {
        try {
            let updateData = { ...data };

            // Upload new image if provided
            if (imageFile) {
                const file = await storage.createFile(BUCKET_ID, ID.unique(), imageFile);
                updateData.imageUrl = storage.getFileView(BUCKET_ID, file.$id).href;
            }

            updateData.updatedAt = Math.floor(Date.now() / 1000);

            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                itemId,
                updateData
            );
        } catch (error) {
            console.error('updateMenuItem error:', error);
            throw error;
        }
    },

    /**
     * Toggle menu item availability
     * @param {string} itemId - Menu item document ID
     * @param {boolean} currentStatus - Current availability status
     * @returns {Object} Updated menu item document
     */
    toggleAvailability: async (itemId, currentStatus) => {
        try {
            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                itemId,
                {
                    available: !currentStatus,
                    updatedAt: Math.floor(Date.now() / 1000)
                }
            );
        } catch (error) {
            console.error('toggleAvailability error:', error);
            throw error;
        }
    },

    /**
     * Update section status (breakfast, lunch, dinner)
     * @param {string} section - Section name
     * @param {boolean} closed - Whether section is closed
     * @returns {Array} Array of update promises
     */
    updateSectionStatus: async (section, closed) => {
        try {
            // First, get all items in the section
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                [Query.equal('section', section)]
            );

            // Update all items in parallel
            const updates = response.documents.map(item =>
                databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.MENU_ITEMS,
                    item.$id,
                    { sectionClosed: closed }
                )
            );

            return await Promise.all(updates);
        } catch (error) {
            console.error('updateSectionStatus error:', error);
            throw error;
        }
    }
};
