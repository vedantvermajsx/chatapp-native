import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import UserSettingsModal from '../../components/modals/UserSettingsModal';
import ThemePickerModal from '../../components/room/ThemePickerModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { dbService } from '../../services/localDB.service';
import { styles } from './styles';

export default function SettingsScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#092125ff';
  const cardBg = theme.isLight ? '#f8fafc' : '#091b1eff';
  const subText = theme.otherUsernameColor;
  const isGuest = user?.role === 'guest';

  const [showProfile, setShowProfile] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear app data?',
      'This removes all local data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: async () => {
            setClearingData(true);
            try {
              await dbService.clearAllData();
              Alert.alert('Done', 'Local app data has been cleared.');
            } catch (e) {
              Alert.alert('Failed', e?.message || 'Could not clear app data');
            } finally {
              setClearingData(false);
            }
          },
        },
      ],
    );
  };

  const Row = ({ icon, label, sub, onPress, right, disabled, isLast }) => (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast, { borderBottomColor: borderColor }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={17} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.otherMessageText }]}>{label}</Text>
        {!!sub && <Text style={[styles.rowSub, { color: subText }]}>{sub}</Text>}
      </View>
      <View style={styles.rowRight}>
        {right}
        <Ionicons name="chevron-forward" size={16} color={subText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} />

      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.otherMessageText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.otherMessageText }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Profile summary */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: cardBg, borderColor, opacity: isGuest ? 0.6 : 1 }]}
          onPress={() => !isGuest && setShowProfile(true)}
          disabled={isGuest}
          activeOpacity={0.7}
        >
          <Avatar url={user?.avatar} name={user?.username} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.otherMessageText }]} numberOfLines={1}>
              {user?.username || 'Guest'}
            </Text>
            <Text style={[styles.profileSub, { color: subText }]} numberOfLines={1}>
              {isGuest ? 'Guest accounts can\u2019t edit a profile' : (user?.bio || 'Tap to edit your profile')}
            </Text>
          </View>
          {!isGuest && <Ionicons name="chevron-forward" size={18} color={subText} />}
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: subText, marginTop: 4 }]}>Preferences</Text>
        <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
          <Row
            icon="color-palette-outline"
            label="Appearance"
            sub="Chat theme and colors"
            onPress={() => setShowThemePicker(true)}
            isLast
          />
        </View>

        {/* Storage & Data */}
        <Text style={[styles.sectionLabel, { color: subText }]}>Storage & Data</Text>
        <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
          <Row
            icon="server-outline"
            label="Storage & Data"
            sub="Manage cached media on this device"
            onPress={() => navigation.navigate('Storage')}
          />
          <Row
            icon="trash-bin-outline"
            label="Clear app data"
            sub="Remove locally synced chats and rooms"
            onPress={handleClearData}
            disabled={clearingData}
            right={clearingData ? <Spinner size="small" color={accent} /> : null}
            isLast
          />
        </View>

        {/* Security & Policy */}
        <Text style={[styles.sectionLabel, { color: subText }]}>Security</Text>
        <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
          <Row
            icon="shield-checkmark-outline"
            label="Security & Policy"
            sub="Privacy policy, terms and account security"
            onPress={() => navigation.navigate('SecurityPolicy')}
            isLast
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.dangerBtn, { borderColor: '#ef4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={17} color="#ef4444" />
          <Text style={styles.dangerBtnText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      <ThemePickerModal visible={showThemePicker} onClose={() => setShowThemePicker(false)} />
      <UserSettingsModal
        visible={showProfile}
        user={user}
        onClose={() => setShowProfile(false)}
        onUpdated={updateUser}
      />
    </SafeAreaView>
  );
}
