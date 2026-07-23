import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login, loading, error } = useAuth();
  const [role, setRole] = useState('employee');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter User ID and Password');
      return;
    }
    try {
      const res = await login(role, userId.trim(), password);
      if (res && res.needsPasswordReset) {
        Alert.alert('Password Reset Required', 'This account requires a initial password change.', [
          {
            text: 'Reset Now',
            onPress: () => navigation.navigate('ResetPassword', { role: res.role, userId: res.userId, email: res.email }),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brandTitle}>FacilityVoice</Text>
        <Text style={styles.brandSubtitle}>Governed Facility-Issue Management System</Text>

        <View style={styles.rolePickerBox}>
          <Text style={styles.rolePickerLabel}>Select Login Role</Text>
          <View style={styles.rolePills}>
            {['employee', 'manager', 'authority'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rolePill, role === r && styles.rolePillActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.hintBox}>
          {role === 'manager' ? (
            <Text style={styles.hintText}>
              System account: ID <Text style={styles.codeText}>manager</Text> | Pass <Text style={styles.codeText}>man123</Text>
            </Text>
          ) : role === 'authority' ? (
            <Text style={styles.hintText}>
              System account: ID <Text style={styles.codeText}>auth</Text> | Pass <Text style={styles.codeText}>auth123</Text>
            </Text>
          ) : (
            <Text style={styles.hintText}>Sign in to report and track facility issues.</Text>
          )}
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>User ID</Text>
          <TextInput
            style={styles.input}
            placeholder={role === 'manager' ? 'manager' : role === 'authority' ? 'auth' : 'Enter User ID'}
            placeholderTextColor="#64748B"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}</Text>}
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
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  rolePickerBox: {
    marginBottom: 16,
  },
  rolePickerLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rolePills: {
    flexDirection: 'row',
    gap: 6,
  },
  rolePill: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rolePillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  rolePillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  hintBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hintText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  codeText: {
    color: '#818CF8',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#450A0A',
    color: '#EF4444',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
  },
  eyeBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#334155',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  eyeText: {
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
    fontSize: 15,
    fontWeight: '700',
  },
});
