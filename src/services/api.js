import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toJson } from '../utils/toJson';
import { emitSessionExpired } from '../events/sessionEvents';
import { dbService } from './localDB.service';

export const BASE_URL = process.env.EXPO_PUBLIC_LOAD_BALENCER_URL_ || 'http://192.168.1.100:5000/api';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor helpers -----

function isFormData(data) {
  return typeof FormData !== 'undefined' && data instanceof FormData;
}

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
  }
  return config;
}

function fixContentTypeForFormData(config) {
  if (isFormData(config.data)) delete config.headers['Content-Type'];
  return config;
}

// --- Response interceptor helpers

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
  if (error.response?.status === 498 || error.response?.status === 401) {
    AsyncStorage.removeItem('token').catch(console.error);
    AsyncStorage.removeItem('user').catch(console.error);
    dbService.clearAllData().catch(console.error);
    emitSessionExpired();
  }
  return error;
}

apiClient.interceptors.request.use(async (config) => {
  config = cleanRequestData(config);
  config = await attachAuthToken(config);
  return fixContentTypeForFormData(config);
});

apiClient.interceptors.response.use((response) => response, async (error) => {
  logError(error);
  await handleUnauthorized(error);
  return Promise.reject(error);
});

export default apiClient;
