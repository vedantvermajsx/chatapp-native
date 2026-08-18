import { Platform } from 'react-native';
import { 
  getMessaging, 
  requestPermission, 
  getToken, 
  deleteToken,
  onTokenRefresh, 
  onMessage, 
  onNotificationOpenedApp, 
  getInitialNotification,
  AuthorizationStatus
} from '@react-native-firebase/messaging';

/**
 * Firebase Cloud Messaging (push notifications).
 *
 *
 * This file only deals with:
 *  - requesting notification permission
 *  - reading the FCM device token
 *  - what happens while the app IS in the foreground
 *  - what happens when the user taps a notification
 */

let foregroundUnsubscribe = null;
let tokenRefreshUnsubscribe = null;
let notificationOpenedUnsubscribe = null;

export async function requestNotificationPermission() {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  return enabled;
}

/**
 * Get the current device's FCM registration token. Send this to server.
 */
export async function getFcmToken() {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    return token;
  } catch (error) {
    return null;
  }
}

export async function registerForPushNotifications(onTokenChange) {
  const enabled = await requestNotificationPermission();
  if (!enabled) return null;

  const token = await getFcmToken();
  if (token && onTokenChange) onTokenChange(token);

  if (tokenRefreshUnsubscribe) tokenRefreshUnsubscribe();
  const messaging = getMessaging();
  tokenRefreshUnsubscribe = onTokenRefresh(messaging, (newToken) => {
    if (onTokenChange) onTokenChange(newToken);
  });

  return token;
}

export function setupForegroundNotificationHandlers({ onForegroundMessage, onNotificationTap } = {}) {
  const messaging = getMessaging();

  if (foregroundUnsubscribe) foregroundUnsubscribe();
  foregroundUnsubscribe = onMessage(messaging, async (remoteMessage) => {
    if (onForegroundMessage) onForegroundMessage(remoteMessage);
  });

  if (notificationOpenedUnsubscribe) notificationOpenedUnsubscribe();
  notificationOpenedUnsubscribe = onNotificationOpenedApp(messaging, (remoteMessage) => {
    if (onNotificationTap) onNotificationTap(remoteMessage);
  });

  getInitialNotification(messaging)
    .then((remoteMessage) => {
      if (remoteMessage) {
        if (onNotificationTap) onNotificationTap(remoteMessage);
      }
    });

  return () => {
    if (foregroundUnsubscribe) foregroundUnsubscribe();
    if (notificationOpenedUnsubscribe) notificationOpenedUnsubscribe();
  };
}

/**
 * Deletes the FCM token on this device (called on logout so the backend
 * stops pushing to a device the user is no longer signed in on).
 */
export async function deleteFcmToken() {
  try {
    const messaging = getMessaging();
    await deleteToken(messaging);
  } catch (error) {
  }
}

export function isIOS() {
  return Platform.OS === 'ios';
}
