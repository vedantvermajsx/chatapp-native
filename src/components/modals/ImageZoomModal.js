import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, Image, StyleSheet, Dimensions, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { toDisplayUrl, addAttachmentFlag } from '../../utils/imageUrl';
import { useCachedMediaUri } from '../../hooks/useCachedMediaUri';
import { styles } from './styles';

const QUALITY_OPTIONS = [
  { key: 'low', label: 'Low' },
  { key: 'mid', label: 'Medium' },
  { key: 'hd', label: 'HD' },
];

export default function ImageZoomModal({ visible, url, media, mediaType = 'image', onClose }) {
  const { width, height } = Dimensions.get('window');
  const [downloadingKey, setDownloadingKey] = useState(null);

  const isVideo = mediaType === 'video';
  const displayUrl = isVideo ? url : (media?.mid || url);
  const cachedImageUri = useCachedMediaUri(!isVideo && visible ? toDisplayUrl(displayUrl) : null, 'images');
  const cachedVideoUri = useCachedMediaUri(isVideo && visible ? displayUrl : null, 'videos');
  const videoSourceUri = cachedVideoUri || displayUrl;

  const player = useVideoPlayer(visible && isVideo ? videoSourceUri : null, (player) => {
    player.play();
  });

  useEffect(() => {
    if (visible && isVideo && videoSourceUri) {
      player.replace(videoSourceUri);
      player.play();
    } else {
      player.replace(null);
    }
  }, [visible, isVideo, videoSourceUri, player]);

  if (!url) return null;

  const qualities = isVideo
    ? [{ key: 'original', label: 'Download', url }]
    : QUALITY_OPTIONS
        .map((q) => ({ ...q, url: media?.[q.key] }))
        .filter((q) => q.url);
  const hasQualities = qualities.length > 0;

  const handleDownload = async (fileUrl, label) => {
    if (!fileUrl || downloadingKey) return;
    setDownloadingKey(label);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to save this file.');
        return;
      }

      const filename = `chat-${isVideo ? 'video' : 'image'}-${label.toLowerCase()}-${Date.now()}`;
      const namedUrl = addAttachmentFlag(fileUrl, filename);
      const ext = isVideo ? 'mp4' : (namedUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)?.[1] || 'jpg');
      const localPath = `${FileSystem.cacheDirectory}${filename}.${ext}`;

      const { uri } = await FileSystem.downloadAsync(namedUrl, localPath);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', `${isVideo ? 'Video' : 'Image'} saved to your photo library.`);
    } catch (e) {
      Alert.alert('Download failed', e?.message || 'Could not save this file.');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.zoomBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <TouchableOpacity style={styles.zoomCloseBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        {isVideo ? (
          <VideoView
            player={player}
            style={{ width: width * 0.92, height: height * 0.6 }}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />
        ) : (
          <Image
            source={{ uri: cachedImageUri || toDisplayUrl(displayUrl) }}
            style={{ width: width * 0.92, height: height * 0.7 }}
            resizeMode="contain"
          />
        )}

        <View style={styles.qualityRow} pointerEvents="box-none">
          {(hasQualities ? qualities : [{ key: 'original', label: 'Download', url }]).map((q) => (
            <TouchableOpacity
              key={q.key}
              style={styles.qualityBtn}
              onPress={() => handleDownload(q.url, q.label)}
              disabled={!!downloadingKey}
            >
              {downloadingKey === q.label ? (
                <ActivityIndicator size="small" color="#1f2937" />
              ) : (
                <Ionicons name="download-outline" size={15} color="#1f2937" />
              )}
              <Text style={styles.qualityText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
