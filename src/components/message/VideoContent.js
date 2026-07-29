import { useCallback, useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../utils/imageUrl';
import { getCachedUri, warmCache } from '../../utils/videoCache';
import { UploadOverlay } from './UploadOverlay';
import { styles } from './styles';

//  idle    → thumbnail with play button (no network)
//  ready   → VideoView with native controls, video playing/buffering
//  paused  → source null + overlay play button (zero network)
//  error   → error overlay

export function VideoContent({ msg, onImagePress, uploadProgress }) {
  const [state, setState] = useState('idle');
  const remoteUrl = msg?.media?.url;
  const savedPositionRef = useRef(0);
  const isResumingRef = useRef(false);
 const activeUriRef = useRef(null);

  const player = useVideoPlayer(null);

  const resolveUri = useCallback(async () => {
    if (!remoteUrl) return null;
    const cached = await getCachedUri(remoteUrl);
    return cached ?? remoteUrl; 
  }, [remoteUrl]);

  useEffect(() => {
    if (state !== 'loading' || !remoteUrl) return;

    let cancelled = false;
    (async () => {
      const uri = await resolveUri();
      if (cancelled) return;
      activeUriRef.current = uri;
      if (!isResumingRef.current) savedPositionRef.current = 0;
      player.replace(uri);
      player.play();
    })();

    return () => { cancelled = true; };
  }, [state, remoteUrl]); 

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        setState('error');
      } else if (status === 'readyToPlay') {
        if (isResumingRef.current) {
          isResumingRef.current = false;
          const pos = savedPositionRef.current;
          if (pos > 0) player.seekBy(pos - (player.currentTime || 0));
          player.play();
        }
        setState('ready');

        if (activeUriRef.current === remoteUrl) {
          warmCache(remoteUrl); 
        }
      }
    });
    return () => sub.remove();
  }, [player, remoteUrl]);

  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying }) => {
      if (!isPlaying && !isResumingRef.current && state === 'ready') {
        savedPositionRef.current = player.currentTime || 0;
        player.replace(null);
        activeUriRef.current = null;
        setState('paused');
      }
    });
    return () => sub.remove();
  }, [player, state]);

  const handleResume = useCallback(() => {
    isResumingRef.current = true;
    setState('loading');
  }, []);

  const handleRetry = useCallback(() => {
    isResumingRef.current = false;
    savedPositionRef.current = 0;
    setState('loading');
  }, []);

  if (state === 'idle') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => setState('loading')}>
        <View style={[styles.mediaImage, styles.videoThumb, { position: 'relative' }]}>
          {(msg.media.thumbnail || msg.media.low) ? (
            <Image
              source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.playBadge}>
            <Ionicons name="play" size={26} color="#fff" />
          </View>
          {msg.isPending && <UploadOverlay progress={uploadProgress} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.mediaImage, styles.videoPlayer]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={state === 'ready'}
      />

      {msg.isPending && <UploadOverlay progress={uploadProgress} />}

      {state === 'loading' && (
        <View style={styles.videoOverlayDim} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {state === 'paused' && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.videoOverlayDim]}
          activeOpacity={0.8}
          onPress={handleResume}
        >
          {(msg.media.thumbnail || msg.media.low) ? (
            <Image
              source={{ uri: toDisplayUrl(msg.media.thumbnail || msg.media.low) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} pointerEvents="none" />
          <View style={styles.playBadge}>
            <Ionicons name="play" size={26} color="#fff" />
          </View>
        </TouchableOpacity>
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

      {onImagePress && state === 'ready' && (
        <TouchableOpacity
          style={styles.videoExpandBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onImagePress({ url: remoteUrl, media: msg.media, mediaType: 'video' })}
        >
          <Ionicons name="expand-outline" size={15} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}