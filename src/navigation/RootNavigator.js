import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GuestScreen from '../screens/GuestScreen';
import RoomListScreen from '../screens/RoomListScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // The white flash on back-navigation is the native root view's default
  // background showing through for a frame before the JS screen paints.
  // Keep it in sync with the current theme so any flash is invisible.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  const screenOpts = {
    headerStyle: { backgroundColor: '#ffffff' },
    headerTintColor: '#111827',
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: 'System' },
    contentStyle: { backgroundColor: theme.background },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary || '#008080'} />
      </View>
    );
  }

  const chatOptions = (props) => {
    const route = props.route;
    const name = route.params && route.params.room
      ? (route.params.room.groupName || route.params.room.name || 'Chat')
      : 'Chat';
    return { title: name };
  };

  if (user) {
    return (
      <Stack.Navigator screenOptions={screenOpts}>
        <Stack.Screen
          name="Rooms"
          component={RoomListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={chatOptions}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Guest"
        component={GuestScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
