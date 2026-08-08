import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function ThemePickerModal({ visible, onClose }) {
  const { user } = useAuth();
  const { theme, THEMES, setTheme, chatBackgroundUri, setChatBackgroundImage, clearChatBackgroundImage } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#ffffffff' : '#374151';
  const isGuest = user?.role === 'guest';
  const [pickingBackground, setPickingBackground] = useState(false);

  const handlePickBackground = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to set a chat background.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setPickingBackground(true);
      setChatBackgroundImage(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not set chat background');
    } finally {
      setPickingBackground(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.themeModalBackdrop, { backgroundColor: 'transparent'}]}>
        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: theme.background,
              borderColor,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              marginBottom:140,
            },
          ]}
        >
          <View style={styles.themeHeader}>
            <Text style={[styles.themeModalTitle, { color: theme.otherMessageText }]}>Appearance</Text>
            <TouchableOpacity style={styles.themeCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.otherMessageText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 320, paddingVertical: 5 }} showsVerticalScrollIndicator={false}>
            <View style={styles.themeGrid}>
              {THEMES.map((t) => {
                const selected = t.id === theme.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.themeCardItem,
                      {
                        backgroundColor: t.background,
                        borderColor: selected
                          ? accent
                          : theme.isLight
                          ? '#e5e7eb'
                          : '#374151',
                      },
                      selected && { borderWidth: 1 },
                    ]}
                    onPress={() => setTheme(t)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.themePreviewRow}>
                      <View
                        style={[
                          styles.bubblePreview,
                          styles.bubbleOther,
                          { backgroundColor: t.otherMessageBubble },
                        ]}
                      >
                        <Text style={{ fontSize: 6, color: t.otherMessageText }}>Hey</Text>
                      </View>
                      <View
                        style={[
                          styles.bubblePreview,
                          styles.bubbleMine,
                          { backgroundColor: t.myMessageBubble },
                        ]}
                      >
                        <Text style={{ fontSize: 6, color: t.myMessageText }}>Hi</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.themeName, { color: t.isLight ? '#111827' : '#fff' }]}
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                    {selected && (
                      <View style={[styles.themeSelectedBadge, { backgroundColor: accent }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chat background — a local, per-device preference for registered users only */}
            {!isGuest && (
              <View style={[styles.bgSection, { borderTopColor: borderColor }]}>
                <Text style={[styles.bgSectionTitle, { color: theme.otherMessageText }]}>Chat background</Text>
                <Text style={[styles.bgSectionSub, { color: theme.otherUsernameColor }]}>
                  Only visible to you, in the chat screen
                </Text>
                <View style={styles.bgRow}>
                  <View style={[styles.bgPreview, styles.bgPreviewEmpty, { borderColor }]}>
                    {pickingBackground ? (
                      <ActivityIndicator size="small" color={accent} />
                    ) : chatBackgroundUri ? (
                      <Image source={{ uri: chatBackgroundUri }} style={{ width: '100%', height: '100%', borderRadius: 11 }} />
                    ) : (
                      <Ionicons name="image-outline" size={20} color={theme.otherUsernameColor} />
                    )}
                  </View>
                  <View style={styles.bgActions}>
                    <TouchableOpacity
                      style={[styles.bgBtn, { borderColor: accent }]}
                      onPress={handlePickBackground}
                      disabled={pickingBackground}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="image" size={14} color={accent} />
                      <Text style={[styles.bgBtnText, { color: accent }]}>
                        {chatBackgroundUri ? 'Change' : 'Choose photo'}
                      </Text>
                    </TouchableOpacity>
                    {chatBackgroundUri && (
                      <TouchableOpacity
                        style={[styles.bgBtn, { borderColor: '#ef4444' }]}
                        onPress={clearChatBackgroundImage}
                        disabled={pickingBackground}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                        <Text style={[styles.bgBtnText, { color: '#ef4444' }]}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
