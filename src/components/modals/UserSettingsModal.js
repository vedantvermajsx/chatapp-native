import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import userService from '../../services/user.service';
import authService from '../../services/auth.service';
import messageService from '../../services/message.service';
import { sanitizeUsernameInput } from '../../utils/validation';
import { styles } from './styles';

export default function UserSettingsModal({ visible, user, onClose, onUpdated }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);

  const [avatarUri, setAvatarUri] = useState(null);  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || ''); 
  const [uploadProgress, setUploadProgress] = useState(null); 

  const requestRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    setUsername(user?.username || '');
    setBio(user?.bio || '');
    setUsernameStatus(null);
    setAvatarUri(null);
    setAvatarUrl(user?.avatar || '');
    setUploadProgress(null);
  }, [visible, user]);

  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed === user?.username) { setUsernameStatus(null); return; }
    if (trimmed.length < 2) { setUsernameStatus('invalid'); return; }
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

  const handleChooseAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to change your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setAvatarUri(asset.uri);   
      setUploadProgress(0);

      const uploaded = await messageService.uploadFile(
        {
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'avatar.jpg',
          fileSize: asset.fileSize,
        },
        'avatars',
        (pct) => setUploadProgress(pct),
      );

      setAvatarUrl(uploaded.url);
      setUploadProgress(null);
    } catch (e) {
      setUploadProgress(null);
      Alert.alert('Upload failed', e?.message || 'Could not upload avatar');
    }
  };

  const handleSave = async () => {
    if (uploadProgress !== null) return; 
    setSaving(true);
    try {
      const res = await userService.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarUrl,
      });
      onUpdated?.(res.user);
      onClose();
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const statusText = {
    checking:  { text: 'Checking availability…',          color: '#3b82f6' },
    available: { text: '✓ Username is available',          color: '#22c55e' },
    taken:     { text: '✗ Username is already taken',      color: '#ef4444' },
    invalid:   { text: 'Username must be at least 2 chars', color: '#ef4444' },
  }[usernameStatus];

  const isBusy = saving || uploadProgress !== null;
  const canSave = !isBusy && usernameStatus !== 'taken' && usernameStatus !== 'invalid';

  if (!user) return null;

  const displayAvatar = avatarUri || avatarUrl || user?.avatar;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor }]}>

          {/* Header */}
          <View style={[styles.header, { borderColor }]}>
            <Text style={[styles.title, { color: theme.otherMessageText }]}>Profile Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>

            {/* Avatar picker */}
            <View style={localStyles.avatarSection}>
              <TouchableOpacity
                onPress={handleChooseAvatar}
                activeOpacity={0.8}
                style={localStyles.avatarWrapper}
                disabled={uploadProgress !== null}
              >
                <Avatar url={displayAvatar} name={username} size={72} />

                {/* Upload progress ring overlay */}
                {uploadProgress !== null && (
                  <View style={localStyles.progressOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={localStyles.progressText}>{uploadProgress}%</Text>
                  </View>
                )}

                {/* Camera badge */}
                <View style={[localStyles.cameraBadge, { backgroundColor: accent }]}>
                  <Ionicons name="camera" size={13} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[localStyles.avatarHint, { color: theme.otherUsernameColor }]}>
                Tap to change avatar
              </Text>
            </View>

            {/* Username */}
            <Text style={[styles.label, { color: theme.otherUsernameColor }]}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(t) => setUsername(sanitizeUsernameInput(t))}
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
            {statusText && (
              <Text style={[styles.statusText, { color: statusText.color }]}>{statusText.text}</Text>
            )}

            {/* Bio */}
            <Text style={[styles.label, { color: theme.otherUsernameColor, marginTop: 14 }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder="Tell us about yourself…"
              placeholderTextColor={theme.otherUsernameColor}
              style={[styles.input, styles.textarea, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', color: theme.otherMessageText }]}
            />
          </View>

          <View style={[styles.footer, { borderColor }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accent, opacity: canSave ? 1 : 0.5 }]}
              onPress={handleSave}
              disabled={!canSave}
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
    borderRadius: 36,
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
    width: 24,
    height: 24,
    borderRadius: 12,
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
