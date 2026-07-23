import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';

export const EmployeeAccountScreen = () => {
  const { user, updateSession, logout } = useAuth();
  const { updateEmployeeProfile } = useComplaints();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    const payload = {};

    if (name.trim() && name.trim() !== user?.name) {
      payload.name = name.trim();
    }

    if (username.trim() && username.trim() !== user?.username) {
      if (username.trim().length < 3) {
        Alert.alert('Validation Error', 'Username must be at least 3 characters long');
        return;
      }
      payload.username = username.trim();
    }

    if (password) {
      if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Validation Error', 'Password must be at least 8 characters long');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        Alert.alert('Validation Error', 'Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(password)) {
        Alert.alert('Validation Error', 'Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        Alert.alert('Validation Error', 'Password must contain at least one numeric digit');
        return;
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        Alert.alert('Validation Error', 'Password must contain at least one special symbol');
        return;
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    setLoading(true);
    try {
      await updateEmployeeProfile(payload);
      if (updateSession) {
        updateSession(payload);
      }
      setLoading(false);
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Profile details updated successfully!');
    } catch (err) {
      setLoading(false);
      Alert.alert('Update Failed', err.message || 'Could not update profile');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="My Profile" subtitle="Account details and security settings" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>

          <Text style={styles.name}>{user?.name || 'User Name'}</Text>
          <Text style={styles.email}>ID: {user?.id || user?.userId || 'N/A'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{user?.role?.toUpperCase() || 'EMPLOYEE'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.sectionTitle}>UPDATE PROFILE DETAILS</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Custom Username (Optional Login Handle)</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. alex_123"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Leave blank to keep same"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#64748B"
            />
          </View>

          <TouchableOpacity style={styles.toggleShowBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggleShowText}>{showPassword ? '🔒 Hide Passwords' : '👁️ Show Passwords'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Save Profile Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 18, paddingBottom: 40 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  name: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  email: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  badgeRow: { marginTop: 8 },
  roleTag: {
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  roleTagText: { color: '#818CF8', fontSize: 10, fontWeight: '700' },
  infoGroup: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  sectionTitle: { color: '#818CF8', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  formGroup: { marginBottom: 14 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  toggleShowBtn: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  toggleShowText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  updateBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  updateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
