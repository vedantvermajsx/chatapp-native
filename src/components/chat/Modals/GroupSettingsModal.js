import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../common/Avatar';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../contexts/ThemeContext';
import roomService from '../../../services/room.service';

export default function GroupSettingsModal({ visible, room, onClose, onUpdated }) {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';
  const [name, setName] = useState(room?.groupName || '');
  const [desc, setDesc] = useState(room?.groupDescription || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(
    () => name.trim() !== (room?.groupName || '').trim() || desc.trim() !== (room?.groupDescription || '').trim(),
    [name, desc, room]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Group name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await roomService.updateRoom(room._id, { groupName: name.trim(), groupDescription: desc.trim(), groupPic: room.groupPic });
      onUpdated?.(res.room);
      onClose();
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not update group');
    } finally {
      setSaving(false);
    }
  };

  if (!room) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor }]}>
          <View style={[styles.header, { borderColor }]}>
            <Text style={[styles.title, { color: theme.otherMessageText }]}>Group Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Avatar url={room.groupPic} name={name} size={80} />
            </View>

            <Text style={[styles.label, { color: theme.otherUsernameColor }]}>Group Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />

            <Text style={[styles.label, { color: theme.otherUsernameColor, marginTop: 14 }]}>Description</Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
          </View>

          <View style={[styles.footer, { borderColor }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.myMessageBubble, opacity: saving || !hasChanges ? 0.5 : 1 }]}
              onPress={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? <Spinner size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 18 },
  label: { fontSize: 12.5, fontWeight: '700' },
  input: { marginTop: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  footer: { padding: 18, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
