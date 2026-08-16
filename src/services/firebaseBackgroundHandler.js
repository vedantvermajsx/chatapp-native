import messaging from '@react-native-firebase/messaging';

export function registerFirebaseBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[FCM] Message handled in the background:', remoteMessage);
  });
}
