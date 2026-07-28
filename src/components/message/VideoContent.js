import { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../utils/imageUrl';
import { UploadOverlay } from './UploadOverlay';
import { styles } from './styles';

export function VideoContent({ msg, onImagePress, uploadProgress }) {
  const [state, setState] = useState('idle');
  const videoRef = useRef(null);
  const url = msg.media.url;

  useEffect(() => {
    return () => {
      videoRef.current?.stopAsync?.().catch(() => {});
    };
  }, []);

  const handlePlaybackStatusUpdate = useCallback((playbackStatus) => {
    if (!playbackStatus.isLoaded) {
      if (playbackStatus.error) setState('error');
      return;
    }
    setState(playbackStatus.isBuffering ? 'buffering' : 'ready');
  }, []);

  const handleError = useCallback(() => setState('error'), []);

  const handleRetry = useCallback(() => {
    setState('loading');
    videoRef.current?.loadAsync({ uri: url }, { shouldPlay: true }, false).catch(() => setState('error'));
  }, [url]);

  if (state === 'idle') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !msg.isPending && setState('loading')}
        disabled={msg.isPending}
      >
        <View style={[styles.mediaImage, styles.videoThumb, { position: 'relative' }]}>
          {msg.media.thumbnail || msg.media.low ? (
            <Image source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          {!msg.isPending && (
            <View style={styles.playBadge}>
              <Ionicons name="play" size={26} color="#fff" />
            </View>
          )}
          {msg.isPending && <UploadOverlay progress={uploadProgress} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.mediaImage, styles.videoPlayer]}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
      />

      {(state === 'loading' || state === 'buffering') && (
        <View style={styles.videoOverlayDim} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {state === 'error' && (
        <View style={styles.videoOverlayDim}>
          <Ionicons name="alert-circle-outline" size={26} color="#fff" />
          <Text style={styles.videoErrorText}>Couldn't play video</Text>
          <TouchableOpacity style={styles.videoRetryBtn} onPress={handleRetry}>
            <Text style={styles.videoRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {onImagePress && state !== 'error' && (
        <TouchableOpacity
          style={styles.videoExpandBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onImagePress({ url, media: msg.media, mediaType: 'video' })}
        >
          <Ionicons name="expand-outline" size={15} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}