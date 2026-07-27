import { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../../utils/imageUrl';
import { styles } from './MessageStyles';

export function VideoContent({ msg, onImagePress }) {
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
        shouldPlay={false}
      />
    </TouchableOpacity>
  );
}
