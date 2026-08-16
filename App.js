import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CallProvider } from './src/contexts/CallContext';
import { useChatSocket } from './src/hooks/useChatSocket';
import { setupOfflineHandler } from './src/services/offlineMessageHandler';
import { setupForegroundNotificationHandlers } from './src/services/firebaseMessaging.service';
import CallOverlay from './src/components/call/CallOverlay';
import RootNavigator from './src/navigation/RootNavigator';
import AppSplashScreen from './src/components/common/AppSplashScreen';

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
  const { loading, user } = useAuth();
  const [showAppSplash, setShowAppSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowAppSplash(false);
    }
  }, [loading]);

  useEffect(() => {
    if (user) setupOfflineHandler();
  }, [user]);

  useEffect(() => {
    setupForegroundNotificationHandlers();
  }, []);

  if (showAppSplash) {
    return <AppSplashScreen />;
  }

  return (
    <CallGate>
      <RootNavigator />
    </CallGate>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <SplashGate />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
