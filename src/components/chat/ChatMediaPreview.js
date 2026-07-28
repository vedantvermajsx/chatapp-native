import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../utils/imageUrl';
import { styles } from './styles';

export default function ChatMediaPreview({ media, onRemove, theme }) {
  if (!media) return null;

  const cardBg = theme.isLight ? '#f3f4f6' : '#1f2937';

  return (
    <View style={[styles.previewWrap, { backgroundColor: cardBg }]}>
      {media.type === 'image' ? (
        <Image source={{ uri: toDisplayUrl(media.uri || media.url) }} style={styles.previewThumbImg} />
      ) : media.type === 'audio' ? (
        <View style={[styles.previewThumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="mic" size={22} color={theme.otherMessageText} />
        </View>
      ) : media.type === 'video' ? (
        <View style={[styles.previewThumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="videocam" size={22} color={theme.otherMessageText} />
        </View>
      ) : (
        <View style={[styles.previewThumb, { backgroundColor: theme.otherMessageBubble }]}>
          <Ionicons name="document" size={22} color={theme.otherMessageText} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.otherMessageText, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {media.type === 'image' ? 'Image attached' : media.type === 'audio' ? 'Voice message attached' : media.type === 'video' ? 'Video attached' : 'Media attached'}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={[styles.previewRemoveBtn, { backgroundColor: theme.otherMessageBubble }]}>
        <Ionicons name="close" size={16} color={theme.otherMessageText} />
      </TouchableOpacity>
    </View>
  );
}
