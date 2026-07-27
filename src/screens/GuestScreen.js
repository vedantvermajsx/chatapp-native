import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { SHARED_BG, SHARED_FORM } from '../styles/sharedAuthStyles';

const GENDERS = [
  { label: 'Male', value: 0 },
  { label: 'Female', value: 1 },
  { label: 'Other', value: 2 },
];

export default function GuestScreen({ navigation }) {
  const { guestLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null);

  const accent = '#008080';

  useEffect(() => {
    let timeout = null;
    const checkUser = async () => {
      const trimmed = username.trim();
      if (trimmed.length === 0) {
        setUsernameStatus(null);
        return;
      }
      if (trimmed.length < 2) {
        setUsernameStatus('invalid');
        return;
      }
      setUsernameStatus('checking');
      try {
        const res = await authService.checkUsername(trimmed);
        setUsernameStatus(!res.isTaken ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('error');
      }
    };
    timeout = setTimeout(checkUser, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleGuest = async () => {
    setError('');
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (username.trim().length < 2 || username.trim().length > 30) {
      setError('Username must be 2–30 characters');
      return;
    }
    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions to continue');
      return;
    }
    setLoading(true);
    const res = await guestLogin(username.trim(), gender);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Could not create guest session');
    }
  };

  const renderUsernameStatus = () => {
    if (usernameStatus === 'checking') {
      return (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#9ca3af" />
          <Text style={styles.statusTextChecking}>Checking availability...</Text>
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text style={styles.statusTextAvailable}>Username is available</Text>
        </View>
      );
    }
    if (usernameStatus === 'taken') {
      return (
        <View style={styles.statusRow}>
          <Ionicons name="close-circle" size={14} color="#dc2626" />
          <Text style={styles.statusTextError}>Username is already taken</Text>
        </View>
      );
    }
    if (usernameStatus === 'invalid') {
      return <Text style={styles.statusTextError}>Username must be at least 2 characters</Text>;
    }
    return null;
  };

  return (
    <View style={styles.root}>
      <View style={styles.background}>
        <View style={styles.gradientGlow} />
        </View>

      <SafeAreaView style={{ flex: 0 }} edges={['top']} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={16} color="#6b7280" />
              <Text style={styles.backBtnText}>Back to sign in</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Join as a guest</Text>
            <Text style={styles.subtitle}>Jump into a conversation, no account needed.</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View>
                
                     <View style={[styles.inputWrapper, { borderColor: 'transparent',borderBottomColor: '#00ffff', backgroundColor: 'transparent' }]}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={(t) => { setUsername(t); if (error) setError(''); }}
                  editable={!loading}
                />
              </View>
              <View style={{ height: 35 }}>{renderUsernameStatus()}</View>
            </View>

              <View style={[styles.inputWrapper, { borderColor: 'transparent', backgroundColor: 'transparent' }]}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <View style={styles.genderInInputRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[
                      styles.genderChip,
                      gender === g.value && [styles.genderChipSelected, { backgroundColor: 'rgba(0,128,128,0.10)', borderColor: accent }]
                    ]}
                    onPress={() => setGender(g.value)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.genderChipText,
                      gender === g.value && { color: accent, fontWeight: '700' }
                    ]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(v => !v)}
              disabled={loading}
            >
              <View style={[
                styles.checkBox,
                agreedToTerms && [styles.checkBoxChecked, { backgroundColor: accent, borderColor: accent }]
              ]}>
                {agreedToTerms ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={[styles.termsLink, { color: accent }]}>Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !agreedToTerms) && styles.buttonDisabled,
                { backgroundColor: accent }
              ]}
              onPress={handleGuest}
              disabled={loading || !agreedToTerms}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonRow}>
                  <Text style={styles.primaryButtonText}>Continue as guest</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.footerTextGray}>Don't have an account? </Text>
              <Text style={[styles.footerLinkText, { color: accent }]}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SafeAreaView style={{ flex: 0 }} edges={['bottom']} />
    </View>
  );
}

const styles = StyleSheet.create({
  ...SHARED_BG,
  heroSub: { marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  ...SHARED_FORM,
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  topBrand: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 24,
    marginBottom: 20,
    maxWidth: 420
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  }
});
