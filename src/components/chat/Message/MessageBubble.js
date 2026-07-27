import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatMessageTime, formatSeenAt } from '../../../utils/dateUtils';
import { toDisplayUrl } from '../../../utils/imageUrl';
import { TextContent } from './TextContent';
import { VideoContent } from './VideoContent';
import { AudioContent } from './AudioContent';
import { UploadOverlay } from './UploadOverlay';
import { styles } from './MessageStyles';

export function MessageBubble({ msg, isOwn, isPrivateChat, showUsername, isTagged, topRadius, bottomRadius, onImagePress }) {
  const { theme } = useTheme();

  const bubbleBg = isOwn ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble) : theme.otherMessageBubble;
  const textColor = isOwn ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText) : theme.otherMessageText;
  const usernameColor = isOwn ? theme.myUsernameColor : theme.otherUsernameColor;

  const isSticker = msg?.media?.type === 'sticker' || msg?.media?.type === 'gif';
  const isImageMedia = msg?.media?.type === 'image';
  const isVideoMedia = msg?.media?.type === 'video';
  const isAudioMedia = msg?.media?.type === 'audio';

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
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low || msg.media.url) }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {msg.isPending && <UploadOverlay progress={msg.media.uploadProgress} />}
                </View>
              </TouchableOpacity>
            )}
            {isVideoMedia && (
              <View style={{ position: 'relative' }}>
                <VideoContent msg={msg} onImagePress={onImagePress} />
                {msg.isPending && <UploadOverlay progress={msg.media.uploadProgress} />}
              </View>
            )}
            {isAudioMedia && (
              <View style={{ position: 'relative' }}>
                <AudioContent msg={msg} isOwn={isOwn} textColor={textColor} />
                {msg.isPending && <UploadOverlay progress={msg.media.uploadProgress} />}
              </View>
            )}
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
