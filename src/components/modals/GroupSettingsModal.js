import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import roomService from '../../services/room.service';
import messageService from '../../services/message.service';
import { styles } from './styles';

export default function GroupSettingsModal({ visible, room, onClose, onUpdated }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';

  const [name, setName] = useState(room?.groupName || '');
  const [desc, setDesc] = useState(room?.groupDescription || '');
  const [saving, setSaving] = useState(false);

  const [picUri, setPicUri] = useState(null);          
  const [picUrl, setPicUrl] = useState(room?.groupPic || ''); 
  const [uploadProgress, setUploadProgress] = useState(null); 

  const hasChanges = useMemo(
    () =>
      name.trim() !== (room?.groupName || '').trim() ||
      desc.trim() !== (room?.groupDescription || '').trim() ||
      (picUrl && picUrl !== (room?.groupPic || '')),
    [name, desc, picUrl, room],
  );

  const handleChoosePic = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to change the group picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],  
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPicUri(asset.uri);  
      setUploadProgress(0);

      const uploaded = await messageService.uploadFile(
        {
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'group.jpg',
          fileSize: asset.fileSize,
        },
        'groups',
        (pct) => setUploadProgress(pct),
      );

      setPicUrl(uploaded.url);
      setUploadProgress(null);
    } catch (e) {
      setUploadProgress(null);
      Alert.alert('Upload failed', e?.message || 'Could not upload image');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Group name is required');
      return;
    }
    if (uploadProgress !== null) return;
    setSaving(true);
    try {
      const res = await roomService.updateRoom(room._id, {
        groupName: name.trim(),
        groupDescription: desc.trim(),
        groupPic: picUrl || room.groupPic,
      });
      onUpdated?.(res.room);
      onClose();
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not update group');
    } finally {
      setSaving(false);
    }
  };

  if (!room) return null;

  const isBusy = saving || uploadProgress !== null;
  const displayPic = picUri || picUrl || room?.groupPic;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor }]}>

          {/* Header */}
          <View style={[styles.header, { borderColor }]}>
            <Text style={[styles.title, { color: theme.otherMessageText }]}>Group Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>

            {/* Group picture picker */}
            <View style={localStyles.avatarSection}>
              <TouchableOpacity
                onPress={handleChoosePic}
                activeOpacity={0.8}
                style={localStyles.avatarWrapper}
                disabled={uploadProgress !== null}
              >
                <Avatar url={displayPic} name={name} size={80} />

                {/* Upload progress overlay */}
                {uploadProgress !== null && (
                  <View style={localStyles.progressOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={localStyles.progressText}>{uploadProgress}%</Text>
                  </View>
                )}

                {/* Camera badge */}
                <View style={[localStyles.cameraBadge, { backgroundColor: accent }]}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[localStyles.avatarHint, { color: theme.otherUsernameColor }]}>
                Tap to change group picture
              </Text>
            </View>

            {/* Group name */}
            <Text style={[styles.label, { color: theme.otherUsernameColor }]}>Group Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />

            {/* Description */}
            <Text style={[styles.label, { color: theme.otherUsernameColor, marginTop: 14 }]}>Description</Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderColor }]}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: accent, opacity: isBusy || !hasChanges ? 0.5 : 1 },
              ]}
              onPress={handleSave}
              disabled={isBusy || !hasChanges}
            >
              {isBusy
                ? <Spinner size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
});
