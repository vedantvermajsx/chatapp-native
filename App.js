import 'react-native-get-random-values';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CallProvider } from './src/contexts/CallContext';
import RootNavigator from './src/navigation/RootNavigator';
import CallScreen from './src/components/chat/CallScreen';
import IncomingCallModal from './src/components/chat/IncomingCallModal';

SplashScreen.preventAutoHideAsync().catch(() => {});

function SplashGate() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  return (
    <>
      <RootNavigator />
      <IncomingCallModal />
      <CallScreen />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CallProvider>
          <NavigationContainer>
            <SplashGate />
          </NavigationContainer>
        </CallProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
