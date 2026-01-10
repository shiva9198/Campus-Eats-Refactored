import { Platform } from 'react-native';

// Default Development URLs
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000';
const IOS_SIMULATOR_URL = 'http://localhost:8000';

// NOTE: Update this if testing on a physical device in dev mode
// const LAN_URL = 'http://192.168.1.5:8000';

export const API_BASE_URL = __DEV__
    ? Platform.OS === 'android'
        ? ANDROID_EMULATOR_URL // Change to LAN_URL if on physical device
        : IOS_SIMULATOR_URL
    : 'https://161cc86451ef.ngrok-free.app'; // REMOTE TESTING (Ngrok)
// : 'https://campus-eats-api.production.com'; // TODO: Revert this for actual store release

// Derive WebSocket URL from API URL (replace http/https with ws/wss)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const BRANDING_ENDPOINT = '/campus/branding';
