import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function SidebarFooter({ setShowUserSettings, setShowThemePicker }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#e5e7eb' : '#374151';

  return (
    <View style={[styles.sidebarFooter, { borderTopColor: borderColor }]}>
      <TouchableOpacity
        style={styles.profileBtn}
        onPress={() => user?.role !== 'guest' && setShowUserSettings(true)}
      >
        <Avatar url={user?.avatar} name={user?.username} size={32} />
        <Text style={[styles.footerUsername, { color: theme.otherMessageText }]} numberOfLines={1}>
          {user?.username || 'Guest'}
        </Text>
      </TouchableOpacity>
      <View style={styles.footerActionsRow}>
        {user?.role !== 'guest' && (
          <TouchableOpacity style={styles.footerIconBtn} onPress={() => setShowUserSettings(true)}>
            <Ionicons name="settings-outline" size={22} color={theme.otherUsernameColor} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.footerIconBtn} onPress={() => setShowThemePicker(true)}>
          <Ionicons name="color-palette-outline" size={22} color={theme.otherUsernameColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIconBtn}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
