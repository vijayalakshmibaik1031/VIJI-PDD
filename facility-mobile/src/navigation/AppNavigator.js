import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { EmployeeNavigator } from './EmployeeNavigator';
import { ManagerNavigator } from './ManagerNavigator';
import { AuthorityNavigator } from './AuthorityNavigator';

export const AppNavigator = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('Login'); // 'Login', 'Register', 'ResetPassword'
  const [resetParams, setResetParams] = useState({});

  React.useEffect(() => {
    if (!isAuthenticated) {
      setAuthScreen('Login');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'ResetPassword') {
      return (
        <ResetPasswordScreen
          route={{ params: resetParams }}
          navigation={{
            navigate: (screen) => setAuthScreen(screen),
          }}
        />
      );
    }
    if (authScreen === 'Register') {
      return (
        <RegisterScreen
          navigation={{
            navigate: (screen) => setAuthScreen(screen),
          }}
        />
      );
    }
    return (
      <LoginScreen
        navigation={{
          navigate: (screen, params) => {
            if (params) setResetParams(params);
            setAuthScreen(screen);
          },
        }}
      />
    );
  }

  const role = user?.role?.toLowerCase();

  const getNavigator = () => {
    switch (role) {
      case 'manager':
        return <ManagerNavigator />;
      case 'authority':
      case 'admin':
        return <AuthorityNavigator />;
      case 'employee':
      default:
        return <EmployeeNavigator />;
    }
  };

  return <AlertMobileContainer>{getNavigator()}</AlertMobileContainer>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingTrigger: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  triggerModalContent: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  pill: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  startBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  popupCard: {
    backgroundColor: '#1E293B',
    borderColor: '#EF4444',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  popupHeader: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  popupInfoBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  popupLabel: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  popupVal: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '800',
  },
  popupDescLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 2,
  },
  popupDescVal: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
  },
  okBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  okBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resolveBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  topBlinkingBanner: {
    position: 'absolute',
    top: 45,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99999,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  bannerResolveBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannerResolveBtnText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
});

const AlertMobileContainer = ({ children }) => {
  const { activeAlerts = [], createAlert, resolveAlert } = useComplaints();
  const { user } = useAuth();
  const [acknowledgedIds, setAcknowledgedIds] = useState([]);
  
  // Trigger alert form states
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [severity, setSeverity] = useState('Critical');
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartAlert = async () => {
    if (!description.trim() || !floor.trim()) {
      Alert.alert('Validation Error', 'Please enter both description and floor number.');
      return;
    }
    setLoading(true);
    try {
      await createAlert({ severity, description, floor });
      setDescription('');
      setFloor('');
      setShowTriggerPanel(false);
      Alert.alert('Success', 'Emergency Alert started successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start alert');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (id) => {
    setAcknowledgedIds(prev => [...prev, id]);
  };

  // Filter alerts
  const unacknowledgedActiveAlerts = activeAlerts.filter(a => !acknowledgedIds.includes(a.id));
  const acknowledgedActiveAlerts = activeAlerts.filter(a => acknowledgedIds.includes(a.id));

  const canResolve = (alert) => {
    if (!user) return false;
    const isAuthority = user.role === 'authority';
    const isManager = user.role === 'manager';
    const isCreator = alert.created_by.toLowerCase() === user.userId.toLowerCase();
    return isAuthority || isManager || isCreator;
  };

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Floating Panel Trigger Button */}
      <TouchableOpacity
        style={styles.floatingTrigger}
        onPress={() => setShowTriggerPanel(true)}
      >
        <Text style={{ fontSize: 18 }}>🚨</Text>
      </TouchableOpacity>

      {/* Trigger Alert Form Modal */}
      <Modal visible={showTriggerPanel} transparent animationType="slide" onRequestClose={() => setShowTriggerPanel(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.triggerModalContent}>
            <Text style={styles.modalTitle}>🚨 Trigger Emergency Alert</Text>

            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.pillsContainer}>
              {['Critical', 'High', 'Medium', 'Low'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, severity === s && styles.pillActive]}
                  onPress={() => setSeverity(s)}
                >
                  <Text style={[styles.pillText, severity === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Floor / Room</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Floor 3, Room 302"
              placeholderTextColor="#64748B"
              value={floor}
              onChangeText={setFloor}
            />

            <Text style={styles.label}>Emergency Description</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              multiline
              placeholder="Describe the issue (e.g. fire, power cut, emergency...)"
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.startBtn} onPress={handleStartAlert} disabled={loading}>
              <Text style={styles.startBtnText}>{loading ? 'Starting Alert...' : 'Start Alert 🚨'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTriggerPanel(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Unacknowledged Active Alert Center Popup Modal */}
      {unacknowledgedActiveAlerts.length > 0 && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.popupCard}>
              <Text style={styles.popupHeader}>🚨 EMERGENCY ALERT</Text>
              
              <View style={styles.popupInfoBox}>
                <Text style={styles.popupLabel}>SEVERITY</Text>
                <Text style={styles.popupVal}>{unacknowledgedActiveAlerts[0].severity.toUpperCase()}</Text>
              </View>

              <Text style={styles.popupDescLabel}>DESCRIPTION</Text>
              <Text style={styles.popupDescVal}>{unacknowledgedActiveAlerts[0].description}</Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.popupDescLabel}>LOCATION</Text>
                  <Text style={styles.popupDescVal}>Floor: {unacknowledgedActiveAlerts[0].floor}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.popupDescLabel}>REPORTED BY</Text>
                  <Text style={styles.popupDescVal}>{unacknowledgedActiveAlerts[0].created_by}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.okBtn} onPress={() => handleAcknowledge(unacknowledgedActiveAlerts[0].id)}>
                  <Text style={styles.okBtnText}>OK</Text>
                </TouchableOpacity>
                {canResolve(unacknowledgedActiveAlerts[0]) && (
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveAlert(unacknowledgedActiveAlerts[0].id)}>
                    <Text style={styles.resolveBtnText}>Turn Off</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Acknowledged Active Alerts Top Blinking Banner */}
      {acknowledgedActiveAlerts.length > 0 && (
        <View style={styles.topBlinkingBanner}>
          <Text style={styles.bannerText}>
            ⚠️ EMERGENCY ({acknowledgedActiveAlerts[0].severity}): {acknowledgedActiveAlerts[0].description} (Floor: {acknowledgedActiveAlerts[0].floor})
          </Text>
          {canResolve(acknowledgedActiveAlerts[0]) && (
            <TouchableOpacity style={styles.bannerResolveBtn} onPress={() => resolveAlert(acknowledgedActiveAlerts[0].id)}>
              <Text style={styles.bannerResolveBtnText}>Turn Off</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
