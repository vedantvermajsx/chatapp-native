import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../utils/imageUrl';

// Mirrors the web app's ChatMediaPreview: a small card above the input
// showing the attached image/video/audio plus a remove button. The asset
// hasn't been uploaded yet at this point (upload happens on Send), so
// images are shown straight from their local file URI.
export default function ChatMediaPreview({ media, onRemove, theme }) {
  if (!media) return null;

  const cardBg = theme.isLight ? '#f3f4f6' : '#1f2937';

  return (
    <View style={[styles.wrap, { backgroundColor: cardBg }]}>
      {media.type === 'image' ? (
        <Image source={{ uri: toDisplayUrl(media.uri || media.url) }} style={styles.thumbImg} />
      ) : media.type === 'audio' ? (
        <View style={[styles.thumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="mic" size={22} color={theme.otherMessageText} />
        </View>
      ) : media.type === 'video' ? (
        <View style={[styles.thumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="videocam" size={22} color={theme.otherMessageText} />
        </View>
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="document" size={22} color={theme.otherMessageText} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.otherMessageText, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {media.type === 'image' ? 'Image attached' : media.type === 'audio' ? 'Voice message attached' : media.type === 'video' ? 'Video attached' : 'Media attached'}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={[styles.removeBtn, { backgroundColor: theme.otherMessageBubble }]}>
        <Ionicons name="close" size={16} color={theme.otherMessageText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 8, marginBottom: 8 },
  thumb: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  thumbImg: { width: 44, height: 44, borderRadius: 8, marginRight: 8 },
  removeBtn: { padding: 5, borderRadius: 999 },
});
