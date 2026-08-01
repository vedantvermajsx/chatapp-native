import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

const LINKS = [
  { key: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline', url: 'https://gatherup-now.onrender.com/#/privacy' },
  { key: 'terms', label: 'Terms of Service', icon: 'document-text-outline', url: 'https://gatherup-now.onrender.com/#/terms' },
  { key: 'licenses', label: 'Open Source Licenses', icon: 'code-slash-outline', url: 'https://raw.githubusercontent.com/vedantvermajsx/chatapp-native/refs/heads/master/LICENSE' },
];

export default function SecurityPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#092125ff';
  const cardBg = theme.isLight ? '#f8fafc' : '#091b1eff';
  const subText = theme.otherUsernameColor;

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} />

      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.otherMessageText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.otherMessageText }]}>Security & Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={[styles.sectionLabel, { color: subText, marginTop: 0 }]}>Account Security</Text>
        <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.row, { borderBottomColor: borderColor }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="lock-closed-outline" size={17} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.otherMessageText }]}>End-to-end session</Text>
              <Text style={[styles.rowSub, { color: subText }]}>
                Your login is protected with a secure token stored only on your device.
              </Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIconWrap, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="phone-portrait-outline" size={17} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.otherMessageText }]}>Signed in on this device</Text>
              <Text style={[styles.rowSub, { color: subText }]}>
                Use Logout in Settings if this isn't your device.
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subText }]}>Legal</Text>
        <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
          {LINKS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.row, idx === LINKS.length - 1 && styles.rowLast, { borderBottomColor: borderColor }]}
              onPress={() => openLink(item.url)}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: `${accent}22` }]}>
                <Ionicons name={item.icon} size={17} color={accent} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.otherMessageText, flex: 1 }]}>{item.label}</Text>
              <Ionicons name="open-outline" size={16} color={subText} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
