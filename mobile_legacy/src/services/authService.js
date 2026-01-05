import { account, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query, ID } from 'react-native-appwrite';

export const authService = {
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Session and user data
     */
    login: async (email, password) => {
        try {
            // Create session
            const session = await account.createEmailPasswordSession(email, password);

            // Get user account details
            const user = await account.get();

            // Check if user is admin
            const isAdmin = await authService.checkAdminStatus(user.$id);

            return {
                session,
                user,
                isAdmin
            };
        } catch (error) {
            console.error('login error:', error);
            throw error;
        }
    },

    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} name - User name
     * @returns {Object} Created account and user profile
     */
    register: async (email, password, name) => {
        try {
            // Create account
            const newAccount = await account.create(
                ID.unique(),
                email,
                password,
                name
            );

            // Create user profile document
            const userProfile = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                {
                    userId: newAccount.$id,
                    email,
                    name,
                    role: 'student',
                    createdAt: Math.floor(Date.now() / 1000)
                }
            );

            return {
                account: newAccount,
                profile: userProfile
            };
        } catch (error) {
            console.error('register error:', error);
            throw error;
        }
    },

    /**
     * Logout current user
     * @returns {Object} Logout response
     */
    logout: async () => {
        try {
            return await account.deleteSession('current');
        } catch (error) {
            console.error('logout error:', error);
            throw error;
        }
    },

    /**
     * Get current user session
     * @returns {Object} Current user data
     */
    getCurrentUser: async () => {
        try {
            const user = await account.get();
            const isAdmin = await authService.checkAdminStatus(user.$id);

            return {
                user,
                isAdmin
            };
        } catch (error) {
            console.error('getCurrentUser error:', error);
            throw error;
        }
    },

    /**
     * Check if user has admin privileges
     * @param {string} userId - User ID to check
     * @returns {boolean} True if user is admin
     */
    checkAdminStatus: async (userId) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ADMIN,
                [Query.limit(1)]
            );

            // Check if user ID matches any admin document
            return response.documents.some(doc => doc.userId === userId);
        } catch (error) {
            console.error('checkAdminStatus error:', error);
            return false;
        }
    }
};
