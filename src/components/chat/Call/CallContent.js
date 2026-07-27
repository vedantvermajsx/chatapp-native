import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../common/Avatar';

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
    <View style={styles.wrap}>
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
              <Text style={styles.name}>{target?.username}</Text>
              <Text style={styles.status}>
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

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  centerColumn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  centerFillDark: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111318' },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  textWrap: { alignItems: 'center' },
  name: { color: '#fff', fontSize: 22, fontWeight: '600' },
  status: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  localPreview: {
    position: 'absolute',
    bottom: 128,
    right: 16,
    width: 112,
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 20,
  },
  localPreviewMini: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 44,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 20,
  },
  lostBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 30,
  },
  lostText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});
