import 'react-native-get-random-values';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CallProvider } from './src/contexts/CallContext';
import { useChatSocket, getActiveChatKey } from './src/hooks/useChatSocket';
import { setupOfflineHandler } from './src/services/offlineMessageHandler';
import { setupForegroundNotificationHandlers } from './src/services/firebaseMessaging.service';
import { navigationRef, navigateToNotificationTarget } from './src/services/pushNavigation';
import { showToast } from './src/utils/toast';
import CallOverlay from './src/components/call/CallOverlay';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

function CallGate({ children }) {
  const { user } = useAuth();
  const { socket } = useChatSocket(user);

  return (
    <CallProvider socket={socket}>
      <CallOverlay />
      {children}
    </CallProvider>
  );
}

function SplashGate() {
  const { user, loading } = useAuth(); 

  useEffect(() => {
    if (user) setupOfflineHandler();
  }, [user]);

  useEffect(() => {
    const unsubscribe = setupForegroundNotificationHandlers({
      onForegroundMessage: (remoteMessage) => {
        const data = remoteMessage?.data || {};
        const chatKey =
          data.type === 'private' ? `private_${data.senderId}` :
          data.type === 'room' ? `room_${data.roomId}` :
          null;

        if (chatKey && chatKey === getActiveChatKey()) return;

        const title = remoteMessage?.notification?.title;
        const body = remoteMessage?.notification?.body;
        if (title || body) {
          showToast([title, body].filter(Boolean).join(': '));
        }
      },
      onNotificationTap: (remoteMessage) => {
        navigateToNotificationTarget(remoteMessage);
      },
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
        .then(() => console.log('[SplashGate] Splash screen hidden successfully'))
        .catch((err) => console.log('[SplashGate] Error hiding splash screen:', err));
    }
  }, [loading]);

  return (
    <CallGate>
      <RootNavigator />
    </CallGate>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <SplashGate />
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
