import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    if (isSignUp) {
      if (!username.trim()) {
        Alert.alert('Username required');
        setLoading(false);
        return;
      }
      const { error } = await signUpWithEmail(email, password, username.trim());
      if (error) Alert.alert('Sign up failed', error.message);
      else router.replace('/(auth)/onboarding');
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) Alert.alert('Login failed', error.message);
    }
    setLoading(false);
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
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggle}>
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 24 },
  title: { color: '#FF6B35', fontSize: 48, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 18, marginBottom: 40 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { color: '#666', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
