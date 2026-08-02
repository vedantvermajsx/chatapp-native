import { ToastAndroid, Alert, Platform } from 'react-native';

/**
 * Show a toast (Android) or a lightweight alert fallback (iOS/web).
 */
export function showToast(message, { long = false } = {}) {
  if (!message) return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, long ? ToastAndroid.LONG : ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

/**
 * Inspect an error (typically an axios error from a service call) and
 * classify it so the user is told what actually went wrong instead of a
 * generic "something went wrong".
 */
export function classifyError(e) {
  if (!e) return { kind: 'unknown', label: 'Error', message: 'Something went wrong' };

  if (e.message === 'Network Error' || !e.response) {
    return { kind: 'network', label: 'No connection', message: 'Check your internet connection and try again' };
  }

  const status = e.response.status;
  const serverMsg = e.response.data?.message;

  if (status === 401 || status === 403) {
    return { kind: 'auth', label: 'Session issue', message: serverMsg || 'You are not authorized to do that' };
  }
  if (status === 404) {
    return { kind: 'not_found', label: 'Not found', message: serverMsg || 'That no longer exists' };
  }
  if (status === 408 || e.code === 'ECONNABORTED') {
    return { kind: 'timeout', label: 'Timed out', message: 'The request took too long, try again' };
  }
  if (status >= 500) {
    return { kind: 'server', label: 'Server error', message: serverMsg || 'Something went wrong on our end' };
  }
  if (status >= 400) {
    return { kind: 'client', label: 'Request failed', message: serverMsg || 'That request could not be completed' };
  }
  return { kind: 'unknown', label: 'Error', message: serverMsg || e.message || 'Something went wrong' };
}

/**
 * Classify + surface an API error as a toast. Returns the classification
 * in case the caller wants to branch on it (e.g. force logout on auth).
 */
export function showApiError(e, fallbackLabel = 'Action failed') {
  const { kind, label, message } = classifyError(e);
  const prefix = kind === 'client' || kind === 'unknown' ? fallbackLabel : label;
  showToast(`${prefix}: ${message}`, { long: kind === 'network' || kind === 'server' || kind === 'timeout' });
  return { kind, label, message };
}
