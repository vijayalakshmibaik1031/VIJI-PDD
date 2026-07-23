import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const CustomHeader = ({ title, subtitle }) => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle}>FACILITY DESK</Text>
          {title && <Text style={styles.pageTitle}>{title}</Text>}
        </View>
        
        {user && (
          <View style={styles.userSection}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pageTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  userSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  roleText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoutText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
});
