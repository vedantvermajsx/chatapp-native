import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

export function registerFirebaseBackgroundHandler() {
  try {
    const messaging = getMessaging();
    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log('[FCM] Message handled in the background:', remoteMessage);
    });
  } catch (err) {
    console.error('[FCM] Error setting up background handler:', err);
  }
}