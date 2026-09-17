import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const {
    signInAsGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isLoading,
    isAuthenticated,
    googleAuthError,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'options' | 'email_login' | 'email_register'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigation.replace('Home');
  }, [isAuthenticated, navigation]);

  const handleGuestSubmit = async () => {
    setIsGuestLoading(true);
    setFormError(null);
    try {
      await signInAsGuest();
    } catch (e: any) {
      setFormError(e?.message || 'Failed to enter guest mode');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    setFormError(null);
    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authTab === 'email_register') {
        await signUpWithEmail(email, password, name.trim());
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e: any) {
      setFormError(e?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>FIRE KEEPER</Text>
        <Text style={styles.subtitle}>Decision Intelligence & AI Governance</Text>
        <Text style={styles.tagline}>
          AI supports the decision.{'\n'}Humans retain decision authority.
        </Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loaderText}>Connecting to Firekeeper...</Text>
          </View>
        ) : (
          <View style={styles.authContainer}>
            {authTab === 'options' ? (
              <>
                {/* Google Sign-In */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={signInWithGoogle}
                  activeOpacity={0.85}
                >
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Email Sign-In Button */}
                <TouchableOpacity
                  style={styles.emailButton}
                  onPress={() => {
                    setAuthTab('email_login');
                    setFormError(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emailButtonIcon}>✉</Text>
                  <Text style={styles.emailButtonText}>Sign In with Email</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Guest Mode */}
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuestSubmit}
                  disabled={isGuestLoading}
                  activeOpacity={0.8}
                >
                  {isGuestLoading ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (
                    <Text style={styles.guestButtonText}>⚡ เข้าใช้งานทันที (Guest Mode)</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.guestNote}>
                  ใช้งานได้ทันที ไม่ต้องกรอกรหัสผ่าน{'\n'}
                  เชื่อมต่อ AI วิเคราะห์การตัดสินใจบน firekeeper.site โดยตรง
                </Text>
              </>
            ) : (
              /* Email / Password Form */
              <View style={styles.formBox}>
                <View style={styles.tabHeader}>
                  <TouchableOpacity
                    style={[styles.tabButton, authTab === 'email_login' && styles.tabButtonActive]}
                    onPress={() => { setAuthTab('email_login'); setFormError(null); }}
                  >
                    <Text style={[styles.tabButtonText, authTab === 'email_login' && styles.tabButtonTextActive]}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabButton, authTab === 'email_register' && styles.tabButtonActive]}
                    onPress={() => { setAuthTab('email_register'); setFormError(null); }}
                  >
                    <Text style={[styles.tabButtonText, authTab === 'email_register' && styles.tabButtonTextActive]}>Register</Text>
                  </TouchableOpacity>
                </View>

                {authTab === 'email_register' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#6b7280"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleEmailSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {authTab === 'email_register' ? 'Create Account' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => { setAuthTab('options'); setFormError(null); }}
                >
                  <Text style={styles.backLinkText}>← Other Sign-In Options</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error notifications */}
            {(formError || googleAuthError) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {formError || googleAuthError}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.powered}>
          Powered by PUNN Cognitive Architecture (PCA){'\n'}
          Connected to firekeeper.site
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  logoImage: {
    width: 88,
    height: 88,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f97316',
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  loaderContainer: { alignItems: 'center', gap: 12 },
  loaderText: { color: '#6b7280', fontSize: 14 },
  authContainer: { width: '100%', maxWidth: 360 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  emailButtonIcon: { color: '#f97316', fontSize: 18 },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2d2d2d' },
  dividerText: { color: '#4b5563', fontSize: 13 },
  guestButton: {
    backgroundColor: '#17120a',
    borderWidth: 1.5,
    borderColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  guestButtonText: { color: '#fb923c', fontSize: 15, fontWeight: '700' },
  guestNote: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  formBox: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 12,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#f97316',
  },
  tabButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 14,
  },
  backLinkText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#1c0a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  errorText: { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  powered: {
    marginTop: 24,
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
});
