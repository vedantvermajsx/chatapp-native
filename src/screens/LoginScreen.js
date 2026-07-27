import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { SHARED_BG, SHARED_FORM } from '../styles/sharedAuthStyles';

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
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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

            <View style={[styles.inputWrapper, { borderColor: 'transparent',borderBottomColor: '#00ffff', backgroundColor: 'transparent' }]}>
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
              <Text style={[styles.footerLinkText]}>Register</Text>
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
  ...SHARED_FORM,
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 18
  },
   card: {
    width: '100%', maxWidth: 420,marginTop:140, backgroundColor: 'transparent', borderRadius: 22, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10
  },
  topBrand: {
    position: 'absolute',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 0,
    top: 100,
    marginBottom: 24,
    left: 70,
    maxWidth: 420
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  }
});
