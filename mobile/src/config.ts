import { Platform } from 'react-native';

// Default Development URLs
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000';
const IOS_SIMULATOR_URL = 'http://localhost:8000';

// NOTE: Update this if testing on a physical device in dev mode
const LAN_URL = 'http://192.168.0.112:8000';

// Production URL from environment (set in .env or build-time)
// For React Native CLI, use react-native-config or hardcode for now
// TEMPORARY: Using ngrok for physical device testing with local backend
const PROD_API_URL = 'https://0106b33e8ef2.ngrok-free.app'; // ngrok tunnel to localhost:8000

// Determine API URL based on environment
const getApiUrl = (): string => {
    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            // Return PROD_API_URL (ngrok) for real device testing as requested by user.
            // This allows the app to connect from any network (e.g. 5G/LTE).
            return PROD_API_URL;
        }
        return IOS_SIMULATOR_URL;
    }
    // Production mode
    if (!PROD_API_URL || PROD_API_URL.includes('placeholder')) {
        console.error('WARNING: Production API URL not configured!');
    }
    return PROD_API_URL;
};

export const API_BASE_URL = getApiUrl();

// Log API URL for debugging (only in dev)
if (__DEV__) {
    console.log('🔗 API URL:', API_BASE_URL);
}

// Derive WebSocket URL from API URL (replace http/https with ws/wss)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const BRANDING_ENDPOINT = '/campus/branding';
