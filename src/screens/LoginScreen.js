import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) return Alert.alert('Missing fields', 'Enter username and password');
    setLoading(true);
    const res = await login(username.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
  };

  const accent = '#008080';

  return (
    <View style={styles.root}>
      {}
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
          {}
          <View style={styles.topBrand}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,128,128,0.15)' }]}>
              <Ionicons name="chatbubbles" size={22} color={accent} />
            </View>
            <Text style={styles.heroTitle}>Quick and reliable,</Text>
            <Text style={[styles.heroTitle, { color: accent }]}>messaging app.</Text>
          </View>

          {}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={[styles.inputWrapper, { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }]}>
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

            <View style={[styles.inputWrapper, { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled, { backgroundColor: accent }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonRow}>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Sign in</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }]}
              onPress={() => navigation.navigate('Guest')}
              disabled={loading}
              activeOpacity={0.6}
            >
              <View style={styles.buttonRow}>
                <Ionicons name="person-outline" size={18} color="#374151" />
                <Text style={styles.secondaryButtonText}>Continue as guest</Text>
              </View>
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
  root: {
    flex: 1,
    backgroundColor: '#060a04',
    position: 'relative'
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060a04',
    overflow: 'hidden'
  },
  gradientGlow: {
    position: 'absolute',
    top: -200,
    left: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(0,128,128,0.28)'
  },
  previewRowTop: {
    position: 'absolute',
    top: 110,
    left: 28,
    right: 28,
    gap: 8
  },
  previewRow: {
    maxWidth: 320
  },
  previewBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '85%'
  },
  previewBubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4
  },
  previewBubbleMine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  previewBubbleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center'
  },
  topBrand: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 24,
    marginBottom: 24,
    maxWidth: 420
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 32,
    letterSpacing: -0.3
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 14.5,
    color: '#6b7280',
    marginBottom: 22
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 10
  },
  inputIcon: {
    paddingHorizontal: 6
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827'
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 18
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerTextGray: {
    color: '#6b7280',
    fontSize: 14
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '600'
  }
});
