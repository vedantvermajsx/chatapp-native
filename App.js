import 'react-native-get-random-values';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CallProvider } from './src/contexts/CallContext';
import { useChatSocket } from './src/hooks/useChatSocket';
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
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
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
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <SplashGate />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
