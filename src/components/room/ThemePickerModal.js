import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function ThemePickerModal({ visible, onClose }) {
  const { theme, THEMES, setTheme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#374151';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.themeModalBackdrop, { backgroundColor: 'transparent' }]}>
        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: theme.background,
              borderColor,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
          ]}
        >
          <View style={styles.themeHeader}>
            <Text style={[styles.themeModalTitle, { color: theme.otherMessageText }]}>Appearance</Text>
            <TouchableOpacity style={styles.themeCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.otherMessageText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420, paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
