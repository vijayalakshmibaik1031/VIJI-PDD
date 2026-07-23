import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export const RegisterScreen = ({ onNavigateLogin }) => {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('IT');
  const [roomNo, setRoomNo] = useState('101');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    try {
      await register(name, email.trim(), password, role, department, roomNo);
      Alert.alert('Registration Successful', 'Please check your email for verification link, then log in.', [
        { text: 'OK', onPress: onNavigateLogin },
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Error creating account');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.badge}>CREATE ACCOUNT</Text>
        <Text style={styles.title}>Join Facility Voice</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#64748B" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="john@org.com" placeholderTextColor="#64748B" autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#64748B" secureTextEntry />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.rolePicker}>
          {['employee', 'manager', 'authority'].map((r) => (
            <TouchableOpacity key={r} style={[styles.roleOption, role === r && styles.roleActive]} onPress={() => setRole(r)}>
              <Text style={[styles.roleOptionText, role === r && styles.roleActiveText]}>{r.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchBtn} onPress={onNavigateLogin}>
        <Text style={styles.switchText}>Already registered? <Text style={styles.switchHighlight}>Sign In</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'center',
  },
  headerBox: {
    marginBottom: 24,
    alignItems: 'center',
  },
  badge: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 15,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  roleOptionText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  roleActiveText: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  switchHighlight: {
    color: '#818CF8',
    fontWeight: '700',
  },
});
