import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import userService from '../../services/user.service';
import { styles } from './styles';

const genderLabel = (g) => ['Male', 'Female', 'Other'][g] || 'Unknown';

export default function UserProfileModal({ visible, userId, fallback, onClose }) {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#cbd5e0' : '#4a5568';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getUserProfile(userId)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch(() => { if (!cancelled) setError('Could not load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, userId]);

  useEffect(() => {
    if (!visible) {
      setProfile(null);
      setError(null);
    }
  }, [visible]);

  const displayName = profile?.username || fallback?.username || '';
  const displayAvatar = profile?.pfp || fallback?.avatar || '';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor }]}>

          <View style={[styles.header, { borderColor }]}>
            <Text style={[styles.title, { color: theme.otherMessageText }]}>Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={localStyles.avatarSection}>
              <Avatar url={displayAvatar} name={displayName} size={80} />
              <Text
                selectable
                style={[localStyles.username, { color: theme.otherMessageText }]}
              >
                {displayName}
              </Text>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 16 }}>
                <Spinner size="small" />
              </View>
            ) : error ? (
              <Text style={[localStyles.errorText]}>{error}</Text>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.otherUsernameColor }]}>Gender</Text>
                <Text
                  selectable
                  style={[localStyles.value, { color: theme.otherMessageText }]}
                >
                  {genderLabel(profile?.gender)}
                </Text>

                <Text style={[styles.label, { color: theme.otherUsernameColor, marginTop: 14 }]}>Bio</Text>
                <Text
                  selectable
                  style={[localStyles.value, { color: theme.otherMessageText }]}
                >
                  {profile?.bio || 'No bio yet'}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    marginTop: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
