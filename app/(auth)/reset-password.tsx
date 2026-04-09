import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (password.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Password updated', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New password</Text>
      <Text style={styles.subtitle}>Choose something you'll remember.</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoFocus
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#666"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : 'Set Password'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b18', justifyContent: 'center', padding: 24 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#4a5568', fontSize: 16, marginBottom: 40 },
  input: { backgroundColor: '#0d1628', color: '#e2e8f0', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
