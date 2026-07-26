import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLastSeen } from '../../utils/dateUtils';

export default function ChatHeader({
  user,
  currentRoom,
  currentPrivateChat,
  isRoomAdmin,
  onBack,
  onOpenMembers,
  onOpenGroupSettings,
  onLeaveOrDelete,
  onStartCall,
  leaving,
}) {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: borderColor }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="chevron-back" size={26} color={theme.otherMessageText} />
      </TouchableOpacity>

      {currentRoom ? (
        <>
          <TouchableOpacity style={styles.titleWrap} onPress={onOpenMembers} activeOpacity={0.7}>
            <Avatar url={currentRoom.groupPic} name={currentRoom.groupName} size={40} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
              <Text style={[styles.name, { color: theme.otherMessageText }]} numberOfLines={1}>
                {currentRoom.groupName}
              </Text>
              {!!currentRoom.groupDescription && (
                <Text style={[styles.sub, { color: theme.otherUsernameColor }]} numberOfLines={1}>
                  {currentRoom.groupDescription}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.actions}>
            {isRoomAdmin && (
              <TouchableOpacity style={styles.iconBtn} onPress={onOpenGroupSettings}>
                <Ionicons name="settings-outline" size={20} color={theme.otherUsernameColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenMembers}>
              <Ionicons name="people-outline" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onLeaveOrDelete} disabled={leaving}>
              <Ionicons
                name={isRoomAdmin && !currentRoom?.isDeleted ? 'trash-outline' : 'exit-outline'}
                size={19}
                color="#ef4444"
              />
            </TouchableOpacity>
          </View>
        </>
      ) : currentPrivateChat ? (
        <>
          <View style={styles.titleWrap}>
            <Avatar url={currentPrivateChat.avatar} name={currentPrivateChat.username} size={40} isOnline={currentPrivateChat.isOnline} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
              <Text style={[styles.name, { color: theme.otherMessageText }]} numberOfLines={1}>
                {currentPrivateChat.username}
              </Text>
              <Text style={[styles.sub, { color: theme.otherUsernameColor }]} numberOfLines={1}>
                {currentPrivateChat.isOnline ? 'Online' : formatLastSeen(currentPrivateChat.lastSeen) || 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onStartCall?.(false)}>
              <Ionicons name="call-outline" size={20} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onStartCall?.(true)}>
              <Ionicons name="videocam-outline" size={21} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={[styles.name, { color: theme.otherUsernameColor, opacity: 0.7, flex: 1, textAlign: 'center' }]}>
          Select a room or start a private chat
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 12.5, marginTop: 1, opacity: 0.8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
