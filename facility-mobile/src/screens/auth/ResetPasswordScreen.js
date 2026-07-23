import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';

export const ResetPasswordScreen = ({ route, navigation }) => {
  const { resetFirstPassword } = useComplaints();
  const { loginWithToken } = useAuth();
  const params = route.params || {};

  const [role, setRole] = useState(params.role || 'employee');
  const [userId, setUserId] = useState(params.userId || '');
  const [email, setEmail] = useState(params.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!userId.trim() || !email.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await resetFirstPassword(role, userId.trim(), email.trim(), newPassword);
      if (res && res.token && res.session) {
        loginWithToken(res.token, res.session);
        Alert.alert('Success', 'Password set successfully! Logging in...');
      } else {
        Alert.alert('Success', 'Password reset successfully! Please sign in with your new password.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (err) {
      Alert.alert('Reset Failed', err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔐 Reset First Password</Text>
        <Text style={styles.subtitle}>Action required for initial account security setup</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Account Role</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={role.toUpperCase()} editable={false} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>User ID</Text>
          <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="e.g. emp001" placeholderTextColor="#64748B" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Corporate Email (@xyzcompany.com)</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="user@xyzcompany.com" placeholderTextColor="#64748B" autoCapitalize="none" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
          />
          <Text style={styles.hint}>Must include 8+ chars, Uppercase, Lowercase, Number & Special Symbol</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
          />
        </View>

        <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleBtnText}>{showPassword ? '🔒 Hide Password' : '👁️ Show Password'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Update Password & Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.cancelBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  disabledInput: {
    color: '#64748B',
    backgroundColor: '#0F172A',
  },
  hint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  toggleBtn: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toggleBtnText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
