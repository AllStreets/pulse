import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(signup === '1');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const setBrowseMode = useUserStore((s) => s.setBrowseMode);

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email first', 'Type your email above then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'pulse://',
    });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Check your email', 'A password reset link has been sent to ' + email.trim());
  }

  function validateUsername(u: string): string | null {
    if (u.length < 3) return 'Username must be at least 3 characters.';
    if (u.length > 20) return 'Username must be 20 characters or fewer.';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Username can only contain letters, numbers, and underscores.';
    return null;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (isSignUp) {
        const usernameErr = validateUsername(username.trim());
        if (usernameErr) { Alert.alert('Invalid username', usernameErr); return; }
        if (password.length < 8) { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return; }
        const { error } = await signUpWithEmail(email, password, username.trim());
        if (error) Alert.alert('Sign up failed', error.message);
        else router.replace('/(auth)/onboarding');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) Alert.alert('Login failed', error.message);
      }
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pulse</Text>
      <Text style={styles.subtitle}>Know what's hot tonight.</Text>
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : isSignUp ? 'Create Account' : 'Log In'}</Text>
      </TouchableOpacity>
      {!isSignUp && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggle}>
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => {
          setBrowseMode(true);
          router.replace('/(tabs)');
        }}
      >
        <Text style={styles.browseText}>Explore the map first →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b18', justifyContent: 'center', padding: 24 },
  title: {
    color: '#00d4ff', fontSize: 52, fontWeight: '900', marginBottom: 6,
    textShadowColor: 'rgba(0,212,255,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitle: { color: '#4a5568', fontSize: 16, marginBottom: 40 },
  input: { backgroundColor: '#0d1628', color: '#e2e8f0', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', marginTop: 14 },
  forgotText: { color: '#1e3a5f', fontSize: 13 },
  toggle: { color: '#4a5568', textAlign: 'center', marginTop: 20, fontSize: 14 },
  browseBtn: { marginTop: 12, alignItems: 'center' },
  browseText: { color: '#00d4ff', fontSize: 13, opacity: 0.6 },
});
