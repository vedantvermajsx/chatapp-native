import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

/**
 * Get the current device's FCM registration token. Send this to server.
 */
export async function getFcmToken() {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.log('Failed to get FCM token', error);
    return null;
  }
}

export async function registerForPushNotifications(onTokenChange) {
  const enabled = await requestNotificationPermission();
  if (!enabled) return null;

  const token = await getFcmToken();
  if (token && onTokenChange) onTokenChange(token);

  if (tokenRefreshUnsubscribe) tokenRefreshUnsubscribe();
  tokenRefreshUnsubscribe = messaging().onTokenRefresh((newToken) => {
    if (onTokenChange) onTokenChange(newToken);
  });

  return token;
}

export function setupForegroundNotificationHandlers({ onForegroundMessage, onNotificationTap } = {}) {
  if (foregroundUnsubscribe) foregroundUnsubscribe();
  foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    if (onForegroundMessage) onForegroundMessage(remoteMessage);
  });

  if (notificationOpenedUnsubscribe) notificationOpenedUnsubscribe();
  notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
    if (onNotificationTap) onNotificationTap(remoteMessage);
  });

  messaging()
    .getInitialNotification()
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

export function isIOS() {
  return Platform.OS === 'ios';
}
