import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMessageTime, formatSeenAt } from '../../utils/dateUtils';
import { toDisplayUrl } from '../../utils/imageUrl';
import { SYSTEM_ICONS } from '../common/SystemIcons.js';

export function SystemMessage({ msg, isPrivateChat }) {
  const { theme } = useTheme();
  const icon = msg.systemType ? SYSTEM_ICONS[msg.systemType] : null;
  return (
    <View style={styles.systemWrap}>
      <View style={[styles.systemPill, { borderColor: theme.otherMessageBubble }]}>
        {icon && <Ionicons name={icon} size={13} color={theme.otherMessageText} style={{ marginRight: 6 }} />}
        <Text style={[styles.systemText, { color: theme.otherMessageText }]}>{msg.text}</Text>
      </View>
      {msg.isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
        <Text style={styles.seenText}>{formatSeenAt(msg.seenAt)}</Text>
      )}
    </View>
  );
}

export function TypingIndicator({ avatar, name, charCount }) {
  const { theme } = useTheme();
  return (
    <View style={styles.rowStart}>
      <Avatar url={avatar} name={name} size={30} style={{ marginRight: 8 }} />
      <View style={[styles.typingBubble, { backgroundColor: theme.otherMessageBubble }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.typingDot, { backgroundColor: theme.otherUsernameColor, opacity: 0.6, marginRight: i < 2 ? 4 : 0 }]} />
        ))}
        {typeof charCount === 'number' && (
          <Text style={{ fontSize: 10, marginLeft: 6, opacity: 0.7, color: theme.otherUsernameColor }}>{charCount}</Text>
        )}
      </View>
    </View>
  );
}

function TextContent({ text, textColor, bubbleBg }) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return (
    <Text style={[styles.msgText, { color: textColor }]}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Text key={i} style={{ fontWeight: '700', color: bubbleBg, backgroundColor: textColor }}>
            {' '}{part}{' '}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

function VideoContent({ msg, onImagePress }) {
  const [playing, setPlaying] = useState(false);
  const url = msg.media.url;

  if (!playing) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => setPlaying(true)}>
        <View style={[styles.mediaImage, styles.videoThumb]}>
          {msg.media.thumbnail || msg.media.low ? (
            <Image source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <View style={styles.playBadge}>
            <Ionicons name="play" size={26} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => onImagePress?.({ url, media: msg.media, mediaType: 'video' })}
    >
      <Video
        source={{ uri: url }}
        style={styles.mediaImage}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
      />
    </TouchableOpacity>
  );
}

export default function MessageBubble({ msg, isOwn, isPrivateChat, showUsername, isTagged, topRadius, bottomRadius, onImagePress }) {
  const { theme } = useTheme();

  const bubbleBg = isOwn ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble) : theme.otherMessageBubble;
  const textColor = isOwn ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText) : theme.otherMessageText;
  const usernameColor = isOwn ? theme.myUsernameColor : theme.otherUsernameColor;

  const isSticker = msg?.media?.type === 'sticker' || msg?.media?.type === 'gif';
  const isImageMedia = msg?.media?.type === 'image';
  const isVideoMedia = msg?.media?.type === 'video';

  return (
    <View style={[styles.row, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
      {!isOwn && <Avatar url={msg.avatar} name={msg.username} size={30} style={{ marginRight: 8, marginBottom: 2 }} />}

      <View style={{ maxWidth: '78%', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {isSticker ? (
          
          
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: toDisplayUrl(msg.media.url) }} style={styles.sticker} resizeMode="contain" />
            {msg.isPending && (
              <Ionicons name="reload-outline" size={14} color="#9ca3af" style={{ position: 'absolute', bottom: 4, right: 4 }} />
            )}
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: bubbleBg,
                borderTopLeftRadius: topRadius?.tl ?? 18,
                borderTopRightRadius: topRadius?.tr ?? 18,
                borderBottomLeftRadius: bottomRadius?.bl ?? 18,
                borderBottomRightRadius: bottomRadius?.br ?? 18,
                borderWidth: isTagged ? 2 : 0,
                borderColor: isTagged ? '#facc15' : 'transparent',
              },
            ]}
          >
            {showUsername && !isPrivateChat && !isOwn && (
              <Text style={[styles.senderName, { color: usernameColor }]} numberOfLines={1}>
                {(msg?.username || '').slice(0, 15)}
              </Text>
            )}
            {isImageMedia && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => onImagePress?.({ url: msg.media.hd || msg.media.mid || msg.media.url, media: msg.media, mediaType: 'image' })}>
                <Image
                  source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low || msg.media.url) }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {isVideoMedia && <VideoContent msg={msg} onImagePress={onImagePress} />}
            <TextContent text={msg.text} textColor={textColor} bubbleBg={bubbleBg} />
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formatMessageTime(msg.timestamp)}</Text>
          {msg.isPending && <Ionicons name="time-outline" size={11} color="#9ca3af" style={{ marginLeft: 4 }} />}
        </View>

        {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
          <Text style={styles.seenText}>{formatSeenAt(msg.seenAt)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', paddingHorizontal: 14, marginTop: 6 },
  rowStart: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, marginTop: 6 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9 },
  senderName: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 14.5, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginHorizontal: 4 },
  timeText: { fontSize: 10.5, color: '#9ca3af', fontWeight: '500' },
  sticker: { width: 110, height: 110 },
  mediaImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 6 },
  videoThumb: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playBadge: { width: 46, height: 46, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderBottomLeftRadius: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 999 },
  systemWrap: { alignItems: 'center', marginVertical: 14 },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  systemText: { fontSize: 12, fontWeight: '600' },
  seenText: { fontSize: 10, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 2, marginHorizontal: 4 },
});
