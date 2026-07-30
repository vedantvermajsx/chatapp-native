import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import UserProfileModal from '../modals/UserProfileModal';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLastSeen } from '../../utils/dateUtils';
import { styles } from './styles';

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
  const [showProfile, setShowProfile] = useState(false);
  const otherUserId = currentPrivateChat?.id || currentPrivateChat?._id;

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
          <TouchableOpacity
            style={styles.titleWrap}
            onPress={() => setShowProfile(true)}
            activeOpacity={0.7}
          >
            <Avatar url={currentPrivateChat.avatar} name={currentPrivateChat.username} size={40} isOnline={currentPrivateChat.isOnline} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
              <Text style={[styles.name, { color: theme.otherMessageText }]} numberOfLines={1}>
                {currentPrivateChat.username}
              </Text>
              <Text style={[styles.sub, { color: theme.otherUsernameColor }]} numberOfLines={1}>
                {currentPrivateChat.isOnline ? 'Online' : formatLastSeen(currentPrivateChat.lastSeen) || 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onStartCall?.(false)}>
              <Ionicons name="call-outline" size={20} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onStartCall?.(true)}>
              <Ionicons name="videocam-outline" size={21} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <UserProfileModal
            visible={showProfile}
            userId={otherUserId}
            fallback={{ username: currentPrivateChat.username, avatar: currentPrivateChat.avatar }}
            onClose={() => setShowProfile(false)}
          />
        </>
      ) : (
        <Text style={[styles.name, { color: theme.otherUsernameColor, opacity: 0.7, flex: 1, textAlign: 'center' }]}>
          Select a room or start a private chat
        </Text>
      )}
    </View>
  );
}
