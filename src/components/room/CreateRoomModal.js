import { Modal, Pressable, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Spinner from '../common/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function CreateRoomModal({
  visible,
  onClose,
  newRoomName,
  setNewRoomName,
  newRoomDesc,
  setNewRoomDesc,
  creatingRoom,
  handleCreateRoom,
}) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#161b23ff';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <View style={[styles.createModalCard, { backgroundColor: theme.background, borderColor }]}>
          <Text style={[styles.createModalTitle, { color: theme.otherMessageText }]}>Create a new room</Text>
          <View
            style={[
              styles.createModalInput,
              {
                backgroundColor: theme.isLight ? '#f3f4f6' : '#141b25ff',
                borderColor: 'transparent',
              },
            ]}
          >
            <Ionicons name="people-circle-outline" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Room name"
              placeholderTextColor="#9ca3af"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
              style={[styles.createModalInputText, { color: theme.otherMessageText }]}
            />
          </View>
          <View
            style={[
              styles.createModalInput,
              {
                backgroundColor: theme.isLight ? '#f3f4f6' : '#141b25ff',
                borderColor: 'transparent',
              },
            ]}
          >
            <Ionicons name="document-text-outline" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={newRoomDesc}
              onChangeText={setNewRoomDesc}
              style={[styles.createModalInputText, { color: theme.otherMessageText }]}
            />
          </View>
          <View style={styles.createModalActions}>
            <TouchableOpacity
              style={[styles.createModalBtn, styles.createModalBtnSecondary, { borderColor }]}
              onPress={onClose}
              disabled={creatingRoom}
            >
              <Text style={[styles.createModalBtnTextSecondary, { color: theme.otherMessageText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createModalBtn,
                styles.createModalBtnPrimary,
                { backgroundColor: accent, opacity: creatingRoom ? 0.6 : 1 },
              ]}
              onPress={handleCreateRoom}
              disabled={creatingRoom}
            >
              {creatingRoom ? (
                <Spinner size="small" color="#fff" />
              ) : (
                <Text style={styles.createModalBtnTextPrimary}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
