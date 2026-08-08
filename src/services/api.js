import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toJson } from '../utils/toJson';

export const BASE_URL = process.env.EXPO_PUBLIC_LOAD_BALENCER_URL_ || 'http://192.168.1.100:5000/api';

console.log('[API] Using BASE_URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor helpers -------------------------------------------------

function isFormData(data) {
  return typeof FormData !== 'undefined' && data instanceof FormData;
}

// Strips null/undefined fields from JSON request bodies so callers don't have
// to hand-roll conditional spreads to keep optional fields out of payloads.
// FormData bodies (file uploads) are left untouched.
function cleanRequestData(config) {
  if (config.data && !isFormData(config.data)) {
    config.data = toJson(config.data);
  }
  return config;
}

async function attachAuthToken(config) {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Using auth token');
  }
  return config;
}

function fixContentTypeForFormData(config) {
  if (isFormData(config.data)) delete config.headers['Content-Type'];
  return config;
}

function logRequest(config) {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (config.data) {
    console.log('[API REQUEST BODY]', config.data);
  }
  return config;
}

// --- Response interceptor helpers ------------------------------------------------

function logResponse(response) {
  console.log(`[API RESPONSE] ${response.status} ${response.config.url}`, response.data);
  return response;
}

function logError(error) {
  console.error('[API ERROR]', error.config?.url, error.message);
  if (error.response) {
    console.error('[API ERROR STATUS]', error.response.status);
    console.error('[API ERROR DATA]', error.response.data);
  } else if (error.request) {
    console.error('[API ERROR] No response received - Network error or CORS issue');
  }
  return error;
}

async function handleUnauthorized(error) {
  if (error.response?.status === 498) {
    await AsyncStorage.multiRemove(['token', 'user']);
  }
  return error;
}

// --- Wiring ------------------------------------------------------------------------

apiClient.interceptors.request.use(async (config) => {
  config = cleanRequestData(config);
  config = await attachAuthToken(config);
  config = fixContentTypeForFormData(config);
  return logRequest(config);
});

apiClient.interceptors.response.use(logResponse, async (error) => {
  logError(error);
  await handleUnauthorized(error);
  return Promise.reject(error);
});

export default apiClient;
