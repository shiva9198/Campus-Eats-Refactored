import { Platform } from 'react-native';

// Appwrite Configuration - with fallbacks for production builds
export const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6953efa40036d5e409af';
export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6953f00a002cfb92d6fc';
export const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '6953f238000526592490';

export const COLLECTIONS = {
    MENU_ITEMS: 'menuItems',
    ORDERS: 'orders',
    USERS: 'users',
    NOTIFICATIONS: 'notifications',
    ADMIN: 'admin',
    SETTINGS: 'settings', // For Global App Settings (Logo, etc.)
    OFFERS: 'offers',     // For promotional banners
};

// Lazy load SDKs to avoid conflicts
let client;
let account;
let databases;
let storage;

if (Platform.OS === 'web') {
    const { Client, Account, Databases, Storage, ID } = require('appwrite');
    client = new Client();
    client
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
    module.exports.ID = ID;
    console.log('--- Appwrite Web SDK Initialized ---');
} else {
    const { Client, Account, Databases, Storage, ID } = require('react-native-appwrite');
    client = new Client();
    client
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setPlatform('com.campus.eats');

    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
    module.exports.ID = ID;
    console.log('--- Appwrite Native SDK Initialized ---');
}

export { client, account, databases, storage };

// Verification: Ping Appwrite
try {
    if (client.ping) {
        client.ping().then(() => {
            console.log('Appwrite Ping Success: Connected to', APPWRITE_ENDPOINT);
        }).catch(err => {
            console.error('Appwrite Ping Failed:', err.message);
        });
    }
} catch (e) {
    // Ignore if method missing in specific SDK version
}

export default client;
