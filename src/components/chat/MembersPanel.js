import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, Animated, Dimensions, Easing, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

const genderLabel = (g) => ['Male', 'Female', 'Other'][g] || 'Unknown';

function MemberRow({ member, isAdmin, isOnline, isMe, onStartPrivateChat, theme }) {
  return (
    <View
      style={[
        styles.memberRow,
        {
          backgroundColor: isAdmin ? (theme.isLight ? 'rgba(0,128,128,0.12)' : 'rgba(96,165,250,0.12)') : theme.background,
          borderColor: theme.isLight ? '#e5e7eb' : '#374151',
        },
      ]}
    >
      <Avatar url={member.avatar} name={member.username} size={40} isOnline={isOnline} />
      <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
        <Text style={[styles.memberName, { color: theme.otherMessageText }]} numberOfLines={1}>
          {member.username}
        </Text>
        <Text style={styles.memberSub} numberOfLines={1}>
          {isAdmin ? 'Admin' : genderLabel(member.gender)}{member.age ? ` \u00b7 ${member.age} yrs` : ''}
        </Text>
      </View>
      {!isMe && (
        <TouchableOpacity style={styles.memberMsgBtn} onPress={() => onStartPrivateChat({ ...member, id: member.id || member._id })}>
          <Ionicons name="chatbubble-outline" size={17} color={theme.otherUsernameColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MembersPanel({ visible, onClose, members, admin, currentUserId, loading, onStartPrivateChat }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';

  const [rendered, setRendered] = useState(visible);
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      translateX.setValue(PANEL_WIDTH);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: PANEL_WIDTH,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const list = members || [];
    if (!search) return list;
    return list.filter((m) => m.username?.toLowerCase().includes(search.toLowerCase()));
  }, [members, search]);

  const online = filtered.filter((m) => m.isOnline).sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  const offline = filtered.filter((m) => !m.isOnline).sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  const sections = [
    ...(online.length ? [{ title: 'Online', data: online }] : []),
    ...(offline.length ? [{ title: 'Offline', data: offline }] : []),
  ];

  if (!rendered) return null;

  return (
    <Modal visible={rendered} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.panelBackdrop}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.0)', opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.panel, { backgroundColor: theme.background, borderColor, transform: [{ translateX }] }]}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={[styles.panelHeader, { borderColor }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="people" size={20} color={theme.otherUsernameColor} />
              <Text style={[styles.panelTitle, { color: theme.otherMessageText }]}>Room Members</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.panelSearchRow, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937' }]}>
            <Ionicons name="search" size={16} color={theme.otherUsernameColor} />
            <TextInput
              placeholder="Search members..."
              placeholderTextColor={theme.otherUsernameColor}
              value={search}
              onChangeText={setSearch}
              style={[styles.panelSearchInput, { color: theme.otherMessageText }]}
            />
          </View>

          {loading && !members?.length ? (
            <View style={{ padding: 30 }}>
              <Spinner size="large" />
            </View>
          ) : (
            <FlatList
              data={sections}
              keyExtractor={(s) => s.title}
              renderItem={({ item: section }) => (
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.panelSectionTitle, { color: theme.otherUsernameColor }]}>{section.title}</Text>
                  {section.data.map((m) => (
                    <MemberRow
                      key={m._id || m.id}
                      member={m}
                      isAdmin={admin === m._id || admin === m.id}
                      isOnline={section.title === 'Online'}
                      isMe={(m._id || m.id) === currentUserId}
                      onStartPrivateChat={onStartPrivateChat}
                      theme={theme}
                    />
                  ))}
                </View>
              )}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="people-outline" size={30} color="#9ca3af" />
                  <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 13 }}>No members found</Text>
                </View>
              }
            />
          )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
