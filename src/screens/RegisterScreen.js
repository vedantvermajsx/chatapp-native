import { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { SHARED_BG, SHARED_FORM } from '../styles/sharedAuthStyles';
import { sanitizeUsernameInput, USERNAME_HINT } from '../utils/validation';

const GENDERS = [
  { label: 'Male', value: 0 },
  { label: 'Female', value: 1 },
  { label: 'Other', value: 2 },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async () => {
    setError('');
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill all fields');
      return;
    }
    if (password.length < 6 || password.length > 50) {
      setError('Password must be between 6 and 50 characters');
      return;
    }
    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions to continue');
      return;
    }
    setLoading(true);
    const res = await register(username.trim(), email.trim(), gender, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Registration failed');
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
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={16} color="#6b7280" />
              <Text style={styles.backBtnText}>Back to sign in</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Set up your space in less than a minute.</Text>

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
                  onChangeText={(t) => { setUsername(sanitizeUsernameInput(t)); if (error) setError(''); }}
                  editable={!loading}
                />
              </View>
              <View style={{ height: 25 }}>
                {renderUsernameStatus() || (
                  <Text style={styles.statusTextChecking}>{USERNAME_HINT}</Text>
                )}
              </View>
            </View>

           <View style={[styles.inputWrapper, { borderColor: 'transparent',borderBottomColor: '#00ffff', backgroundColor: 'transparent' }]}>
             <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                editable={!loading}
              />
            </View>

 <View style={[styles.inputWrapper, { borderColor: 'transparent',borderBottomColor: '#00ffff', backgroundColor: 'transparent' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (6-50 characters)"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                editable={!loading}
              />
            </View>


           <View style={[styles.inputWrapper, { borderColor: 'transparent', backgroundColor: 'transparent' }]}>
          
              <Ionicons name="people-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
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
              onPress={handleRegister}
              disabled={loading || !agreedToTerms}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonRow}>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Create account</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.footerTextGray}>Already have an account? </Text>
              <Text style={[styles.footerLinkText, { color: accent }]}>Log in</Text>
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

