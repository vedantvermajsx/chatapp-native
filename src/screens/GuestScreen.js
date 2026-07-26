import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';

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
        <View style={[styles.previewRow, styles.previewRowTop]}>
          <View style={[styles.previewBubble, styles.previewBubbleOther, { opacity: 0.45 }]}>
            <Text style={styles.previewBubbleText}>did you see the new design room?</Text>
          </View>
          <View style={[styles.previewBubble, styles.previewBubbleMine, { backgroundColor: accent, alignSelf: 'flex-end', opacity: 0.3 }]}>
            <Text style={[styles.previewBubbleText, { color: '#fff' }]}>just joined</Text>
          </View>
          <View style={[styles.previewBubble, styles.previewBubbleOther, { opacity: 0.2 }]}>
            <Text style={styles.previewBubbleText}>perfect timing, we're gathering up now</Text>
          </View>
        </View>
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
          <View style={styles.topBrand}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,128,128,0.15)' }]}>
              <Ionicons name="rocket-outline" size={22} color={accent} />
            </View>
            <Text style={styles.heroTitle}>Join as a</Text>
            <Text style={[styles.heroTitle, { color: accent }]}>guest</Text>
            <Text style={styles.heroSub}>Jump into a conversation, no account needed.</Text>
          </View>

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
              <View style={[styles.inputWrapper, { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }]}>
                <Ionicons name="pricetag-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={(t) => { setUsername(t); if (error) setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              <View style={{ height: 22 }}>{renderUsernameStatus()}</View>
            </View>

            <View style={[styles.inputWrapper, { borderColor: '#e5e7eb', backgroundColor: '#ffffff', paddingVertical: 2 }]}>
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
                  <Ionicons name="rocket" size={18} color="#fff" />
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

const SHARED_BG = {
  root: { flex: 1, backgroundColor: '#060a04', position: 'relative' },
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#060a04', overflow: 'hidden' },
  gradientGlow: {
    position: 'absolute', top: -200, left: -120, width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(0,128,128,0.28)'
  },
  previewRowTop: { position: 'absolute', top: 90, left: 28, right: 28, gap: 8 },
  previewRow: { maxWidth: 320 },
  previewBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: '85%' },
  previewBubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start', borderBottomLeftRadius: 4
  },
  previewBubbleMine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  previewBubbleText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
  topBrand: { alignItems: 'flex-start', alignSelf: 'stretch', marginTop: 24, marginBottom: 20, maxWidth: 420 },
  heroBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: 'rgba(255,255,255,0.82)', lineHeight: 32, letterSpacing: -0.3 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 22, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10
  }
};

const SHARED_FORM = {
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 12, gap: 5 },
  backBtnText: { color: '#6b7280', fontSize: 13 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14.5, color: '#6b7280', marginBottom: 22 },
  errorBanner: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 2 },
  inputIcon: { paddingHorizontal: 6 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, marginBottom: 8 },
  statusTextChecking: { color: '#6b7280', fontSize: 12 },
  statusTextAvailable: { color: '#059669', fontSize: 12 },
  statusTextError: { color: '#dc2626', fontSize: 12, marginTop: 2, marginBottom: 8 },
  genderInInputRow: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 6, paddingRight: 6 },
  genderChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  genderChipSelected: { backgroundColor: 'rgba(0,128,128,0.10)' },
  genderChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8, marginBottom: 20, paddingHorizontal: 4 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#d1d5db', marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkBoxChecked: { backgroundColor: '#008080', borderColor: '#008080' },
  termsText: { fontSize: 13, color: '#4b5563', lineHeight: 18, flex: 1 },
  termsLink: { fontWeight: '600' },
  primaryButton: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  buttonDisabled: { opacity: 0.55 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerTextGray: { color: '#6b7280', fontSize: 14 },
  footerLinkText: { fontSize: 14, fontWeight: '600' }
};

const styles = StyleSheet.create({
  ...SHARED_BG,
  heroSub: { marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  ...SHARED_FORM
});
