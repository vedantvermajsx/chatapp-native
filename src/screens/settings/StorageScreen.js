import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Spinner from '../../components/common/Spinner';
import { getCacheStats, clearCache } from '../../utils/mediaCache';
import { styles as sharedStyles } from './styles';

const CATEGORIES = [
  { kind: 'videos', label: 'Videos', icon: 'videocam-outline', color: '#8b5cf6' },
  { kind: 'images', label: 'Images', icon: 'image-outline', color: '#3b82f6' },
  { kind: 'stickers', label: 'Stickers & GIFs', icon: 'happy-outline', color: '#f59e0b' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function StorageScreen({ navigation }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#092125ff';
  const cardBg = theme.isLight ? '#f8fafc' : '#091b1eff';
  const subText = theme.otherUsernameColor;

  const [stats, setStats] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [clearingKind, setClearingKind] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [videos, images, stickers] = await Promise.all([
        getCacheStats('videos'),
        getCacheStats('images'),
        getCacheStats('stickers'),
      ]);
      setStats({ videos, images, stickers });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const totalBytes = stats ? stats.videos.size + stats.images.size + stats.stickers.size : 0;
  const totalCount = stats ? stats.videos.count + stats.images.count + stats.stickers.count : 0;

  const handleClearOne = (kind, label) => {
    Alert.alert(
      `Clear cached ${label.toLowerCase()}?`,
      `This frees up ${formatBytes(stats?.[kind]?.size || 0)}. They'll be re-downloaded next time you open them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearingKind(kind);
            try {
              await clearCache(kind);
              await loadStats();
            } finally {
              setClearingKind(null);
            }
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear all media cache?',
      `This frees up ${formatBytes(totalBytes)} of downloaded videos, images, stickers, and GIFs across all chats.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            setClearingKind('all');
            try {
              await Promise.all(CATEGORIES.map((c) => clearCache(c.kind)));
              await loadStats();
            } finally {
              setClearingKind(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} />

      <View style={[sharedStyles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.otherMessageText} />
        </TouchableOpacity>
        <Text style={[sharedStyles.headerTitle, { color: theme.otherMessageText }]}>Storage & Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={[localStyles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          {loading ? (
            <ActivityIndicator size="small" color={subText} />
          ) : (
            <>
              <Text style={[localStyles.summaryTotal, { color: theme.otherMessageText }]}>{formatBytes(totalBytes)}</Text>
              <Text style={[localStyles.summarySub, { color: subText }]}>
                {totalCount} {totalCount === 1 ? 'file' : 'files'} cached on this device for offline playback
              </Text>
            </>
          )}
        </View>

        {CATEGORIES.map(({ kind, label, icon, color }) => {
          const s = stats?.[kind];
          const isClearing = clearingKind === kind || clearingKind === 'all';
          return (
            <View key={kind} style={[localStyles.row, { backgroundColor: cardBg, borderColor }]}>
              <View style={[localStyles.iconWrap, { backgroundColor: `${color}22` }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[localStyles.rowLabel, { color: theme.otherMessageText }]}>{label}</Text>
                <Text style={[localStyles.rowSub, { color: subText }]}>
                  {loading ? 'Calculating…' : `${formatBytes(s?.size || 0)} · ${s?.count || 0} ${s?.count === 1 ? 'file' : 'files'}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleClearOne(kind, label)}
                disabled={loading || isClearing || !s?.count}
                style={{ opacity: !s?.count ? 0.35 : 1 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {clearingKind === kind ? (
                  <Spinner size="small" color={accent} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={accent} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={[localStyles.clearAllBtn, { borderColor: '#ef4444', opacity: clearingKind ? 0.6 : 1 }]}
          onPress={handleClearAll}
          disabled={loading || !!clearingKind || totalCount === 0}
        >
          {clearingKind === 'all' ? (
            <Spinner size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={localStyles.clearAllText}>Clear all media cache</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: '700',
  },
  summarySub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  footnote: {
    fontSize: 11,
    marginTop: 18,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
