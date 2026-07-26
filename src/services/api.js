import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = process.env.EXPO_PUBLIC_LOAD_BALENCER_URL_ || 'http://192.168.1.100:5000/api';

console.log('[API] Using BASE_URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (config.data) {
    console.log('[API REQUEST BODY]', config.data);
  }
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Using auth token');
  }
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    console.error('[API ERROR]', error.config?.url, error.message);
    if (error.response) {
      console.error('[API ERROR STATUS]', error.response.status);
      console.error('[API ERROR DATA]', error.response.data);
    } else if (error.request) {
      console.error('[API ERROR] No response received - Network error or CORS issue');
    }
    if (error.response?.status === 498) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
