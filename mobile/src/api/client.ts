import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Day 5: Explicit Base URL for better reliability vs "localhost" magic
// Android Emulator: 10.0.2.2
// Physical Device: Replace with your LAN IP (e.g., http://192.168.1.5:8000)
const ANDROID_URL = 'http://10.0.2.2:8000';
const IOS_URL = 'http://localhost:8000';
const BASE_URL = Platform.OS === 'android' ? ANDROID_URL : IOS_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Day 10: 10-second timeout (no infinite spinners)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Day 14: Request Interceptor (Inject Token)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error reading token for request interceptor', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Day 10 & 14: Response Interceptor for error logging and 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Day 14: Auto-logout on 401
      if (status === 401) {
        console.warn('[API] 401 Unauthorized - Clearing token');
        await AsyncStorage.removeItem('token');
        // Note: UI update happens reactively via AuthContext checking AsyncStorage or re-render
        // Ideally, we'd trigger a global event here if immediate UI refresh is needed
        // But for now, next simple action will fail or app reload works.
        // Actually, for immediate logout, Context syncing is better, but as per plan:
        // "Let UI re-render -> Login screen" (might need a force update mechanism if Context doesn't know)
        // Since AuthContext handles restoration, we rely on standard flow.
      } else if (status === 422) {
        console.warn('[API] Validation Error (422):', data);
      } else if (status >= 500) {
        console.error('[API] Server Error (500+):', status, data);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('[API] Request Timeout (10s exceeded)');
    } else if (error.message === 'Network Error') {
      console.error('[API] Network Error (offline or unreachable)');
    }
    return Promise.reject(error);
  }
);

// Day 10: Network Error Classification
export const classifyNetworkError = (error: any): 'timeout' | 'offline' | 'server' | 'unknown' => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {return 'timeout';}
    if (error.message === 'Network Error') {return 'offline';}
    if (error.response && error.response.status >= 500) {return 'server';}
  }
  return 'unknown';
};

export const getUserFriendlyError = (error: any): string => {
  const errorType = classifyNetworkError(error);
  switch (errorType) {
    case 'timeout':
      return 'Request timed out after 10 seconds. Please try again.';
    case 'offline':
      return 'No network connection. Please check your Wi-Fi or mobile data.';
    case 'server':
      return 'Server error. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Day 10: Retry Logic (GET requests only, max 2 retries, exponential backoff)
const retryRequest = async (fn: () => Promise<any>, retries = 2): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {throw error;}

    const errorType = classifyNetworkError(error);
    // Don't retry on client errors (400-499 except timeout)
    if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500 && errorType !== 'timeout') {
      throw error;
    }

    // Exponential backoff: 1s, 2s
    const delay = (3 - retries) * 1000;
    console.log(`[API] Retrying request in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1);
  }
};

export const getMenu = async () => {
  return retryRequest(async () => {
    const response = await apiClient.get('/menu');
    return response.data;
  });
};

export const updateMenuItemAvailability = async (id: number, is_available: boolean) => {
  // No retry for PATCH (mutation)
  const response = await apiClient.patch(`/menu/${id}/availability`, { is_available });
  return response.data;
};

// Day 14: Auth API
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await apiClient.post('/token', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { access_token, token_type }
};

export const register = async (userData: any) => {
  const response = await apiClient.post('/register', userData);
  return response.data; // Returns User object
};

// Day 3/14: Create Order (Authenticated)
export const createOrder = async (orderData: any) => {
  const response = await apiClient.post('/orders/', orderData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await apiClient.get('/orders/');
  return response.data;
};
