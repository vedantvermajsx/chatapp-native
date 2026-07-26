import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import GuestScreen from './src/screens/GuestScreen';
import RoomListScreen from './src/screens/RoomListScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator();

const screenOpts = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTintColor: '#111827',
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: 'System' }
};

function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

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

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
