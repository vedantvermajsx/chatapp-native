import { memo } from 'react';
import { View, Text, TouchableOpacity, Pressable, ToastAndroid } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMessageTime, formatSeenAt } from '../../utils/dateUtils';
import { toDisplayUrl } from '../../utils/imageUrl';
import { useCachedMediaUri } from '../../hooks/useCachedMediaUri';
import { TextContent } from './TextContent';
import { VideoContent } from './VideoContent';
import { AudioContent } from './AudioContent';
import { UploadOverlay } from './UploadOverlay';
import { styles } from './styles';

function handleLongPressCopy(text) {
  if (!text) return;

  Clipboard.setStringAsync(text);

  ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
}

export const MessageBubble = memo(function MessageBubble({ msg, isOwn, isPrivateChat, showUsername, isTagged, topRadius, bottomRadius, onImagePress, uploadProgress, onReplyPress }) {
  const { theme } = useTheme();

  const bubbleBg = isOwn ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble) : theme.otherMessageBubble;
  const textColor = isOwn ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText) : theme.otherMessageText;
  const usernameColor = isOwn ? theme.myUsernameColor : theme.otherUsernameColor;

  const isSticker = msg?.media?.type === 'sticker' || msg?.media?.type === 'gif';
  const isImageMedia = msg?.media?.type === 'image';
  const isVideoMedia = msg?.media?.type === 'video';
  const isAudioMedia = msg?.media?.type === 'audio';
  const isVisualMedia = isImageMedia || isVideoMedia;
  const hasCaption = !!msg.text;
  const showSenderName = showUsername && !isPrivateChat && !isOwn;
  const replyTo = msg.replyTo;
  const replyMediaLabel = replyTo?.media
    ? { image: 'Photo', video: 'Video', audio: 'Voice message', sticker: 'Sticker', gif: 'GIF' }[replyTo.media.type] || 'Attachment'
    : null;

  return (
    <View style={[styles.row, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
      {!isOwn && <Avatar url={msg.avatar} name={msg.username} size={30} style={{ marginRight: 8, marginBottom: 2 }} />}

      <View style={{ maxWidth: '78%', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {isSticker ? (
          <StickerBubble msg={msg} />
        ) : (
          <Pressable
            onLongPress={() => handleLongPressCopy(msg.text)}
            delayLongPress={350}
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
            {replyTo && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onReplyPress?.(replyTo)}
                style={[
                  styles.replyQuote,
                  {
                    backgroundColor: isOwn ? 'rgba(0,0,0,0.12)' : theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                    borderLeftColor: usernameColor,
                  },
                ]}
              >
                <Text style={[styles.replyQuoteName, { color: usernameColor }]} numberOfLines={1}>
                  {replyTo.username || 'Unknown'}
                </Text>
                <Text style={[styles.replyQuoteText, { color: textColor }]} numberOfLines={1}>
                  {replyMediaLabel || replyTo.text || 'Message'}
                </Text>
              </TouchableOpacity>
            )}
            {isVisualMedia ? (
              <>
                {showSenderName && (
                  <View style={styles.bubbleMediaHeader}>
                    <Text style={[styles.senderName, { color: usernameColor, marginBottom: 0 }]} numberOfLines={1}>
                      {(msg?.username || '').slice(0, 15)}
                    </Text>
                  </View>
                )}
                {isImageMedia && (
                  <ImageThumb msg={msg} onImagePress={onImagePress} uploadProgress={uploadProgress} isPending={msg.isPending} />
                )}
                {isVideoMedia && <VideoContent msg={msg} onImagePress={onImagePress} uploadProgress={uploadProgress} />}
                {hasCaption && (
                  <View style={styles.bubbleCaption}>
                    <TextContent text={msg.text} textColor={textColor} bubbleBg={bubbleBg} />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.bubblePad}>
                {showSenderName && (
                  <Text style={[styles.senderName, { color: usernameColor }]} numberOfLines={1}>
                    {(msg?.username || '').slice(0, 15)}
                  </Text>
                )}
                {isAudioMedia && (
                  <View style={{ position: 'relative' }}>
                    <AudioContent msg={msg} isOwn={isOwn} textColor={textColor} />
                    {msg.isPending && <UploadOverlay progress={uploadProgress} />}
                  </View>
                )}
                <TextContent text={msg.text} textColor={textColor} bubbleBg={bubbleBg} />
              </View>
            )}
          </Pressable>
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
});

function StickerBubble({ msg }) {
  const remoteUrl = toDisplayUrl(msg.media.url);
  const cachedUri = useCachedMediaUri(!msg.isPending ? remoteUrl : null, 'stickers');

  return (
    <View style={{ position: 'relative' }}>
      <Image source={{ uri: cachedUri || remoteUrl }} style={styles.sticker} contentFit="contain" />
      {msg.isPending && (
        <Ionicons name="reload-outline" size={14} color="#9ca3af" style={{ position: 'absolute', bottom: 4, right: 4 }} />
      )}
    </View>
  );
}

function ImageThumb({ msg, onImagePress, uploadProgress, isPending }) {
  const remoteUrl = toDisplayUrl(msg.media.thumbnail || msg.media.low || msg.media.url);
  const cachedUri = useCachedMediaUri(!isPending ? remoteUrl : null, 'images');

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onImagePress?.({ url: msg.media.hd || msg.media.mid || msg.media.url, media: msg.media, mediaType: 'image' })}>
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: cachedUri || remoteUrl }}
          style={styles.mediaImage}
          contentFit="cover"
        />
        {isPending && <UploadOverlay progress={uploadProgress} />}
      </View>
    </TouchableOpacity>
  );
}