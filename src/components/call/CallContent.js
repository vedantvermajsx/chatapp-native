import { View, Text, StyleSheet } from 'react-native';
//import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { styles } from './styles';

const FALLBACK_AVATAR = 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/male_g68rxt.avif';

export default function CallContent({
  isVideo,
  isConnecting,
  isMinimized,
  isLost,
  remoteStream,
  localStream,
  target,
  durationStr,
}) {
  const showRemoteVideo = isVideo && remoteStream && !isConnecting;

  return (
    <View style={styles.contentWrap}>
      {showRemoteVideo && (
        <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
      )}

      {!showRemoteVideo && (
        <View style={isMinimized ? styles.centerFillDark : styles.centerColumn}>
          {!isMinimized && <View style={styles.glow} />}
          <Avatar
            url={target?.avatar || FALLBACK_AVATAR}
            name={target?.username}
            size={isMinimized ? 64 : 112}
            style={isMinimized ? undefined : { marginBottom: 16 }}
          />
          {!isMinimized && (
            <View style={styles.textWrap}>
              <Text style={styles.contentName}>{target?.username}</Text>
              <Text style={styles.contentStatus}>
                {isConnecting ? 'Calling\u2026' : isVideo ? `Video call \u00b7 ${durationStr}` : `Audio call \u00b7 ${durationStr}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {isVideo && localStream && (
        <View style={isMinimized ? styles.localPreviewMini : styles.localPreview}>
          <RTCView
            streamURL={localStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            mirror
            zOrder={1}
          />
        </View>
      )}

      {!isMinimized && isLost && (
        <View style={styles.lostBadge}>
          <Ionicons name="wifi-outline" size={14} color="#fff" />
          <Text style={styles.lostText}>Connection Lost</Text>
        </View>
      )}
    </View>
  );
}
