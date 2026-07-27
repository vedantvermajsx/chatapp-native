import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../../common/Avatar';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../contexts/ThemeContext';
import userService from '../../../services/user.service';
import authService from '../../../services/auth.service';
import messageService from '../../../services/message.service';

export default function UserSettingsModal({ visible, user, onClose, onUpdated }) {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const requestRef = useRef(0);

  const handleChooseAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];

      setUploadingAvatar(true);
      const uploaded = await messageService.uploadFile(
        {
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'avatar.jpg',
          fileSize: asset.fileSize,
        },
        'avatars'
      );
      setAvatar(uploaded.url);
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setBio(user?.bio || '');
    setUsernameStatus(null);
  }, [visible, user]);

  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed === user?.username) {
      setUsernameStatus(null);
      return;
    }
    if (trimmed.length < 2) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const requestId = ++requestRef.current;
    const t = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(trimmed);
        if (requestId !== requestRef.current) return;
        setUsernameStatus(res.isTaken ? 'taken' : 'available');
      } catch {
        if (requestId !== requestRef.current) return;
        setUsernameStatus('error');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [username, user?.username]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile({ username: username.trim(), bio: bio.trim(), avatar });
      onUpdated?.(res.user);
      onClose();
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const statusText = {
    checking: { text: 'Checking availability...', color: '#3b82f6' },
    available: { text: '\u2713 Username is available', color: '#22c55e' },
    taken: { text: '\u2717 Username is already taken', color: '#ef4444' },
    invalid: { text: 'Username must be at least 2 characters', color: '#ef4444' },
  }[usernameStatus];

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor }]}>
          <View style={[styles.header, { borderColor }]}>
            <Text style={[styles.title, { color: theme.otherMessageText }]}>Profile Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <View style={{ position: 'relative' }}>
                <Avatar url={avatar} name={username} size={60} />
                {uploadingAvatar && (
                  <View style={styles.avatarUploadingOverlay}>
                    <Spinner size="small" color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleChooseAvatar}
                  disabled={uploadingAvatar}
                  style={[styles.cameraBadge, { backgroundColor: theme.myMessageBubble, borderColor: theme.background }]}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.otherUsernameColor }]}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
            {statusText && <Text style={[styles.statusText, { color: statusText.color }]}>{statusText.text}</Text>}

            <Text style={[styles.label, { color: theme.otherUsernameColor, marginTop: 14 }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.otherUsernameColor}
              style={[styles.input, styles.textarea, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
          </View>

          <View style={[styles.footer, { borderColor }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.myMessageBubble, opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
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
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  footer: { padding: 18, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});