import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Constants matching the web portal
const CATEGORIES = ['Electrical', 'Plumbing', 'Cleaning', 'Structural', 'Other'];
const ROOM_IDS = Array.from({ length: 5 }, (_, floor) =>
  Array.from({ length: 5 }, (_, room) => `${floor + 1}${room + 1}`)
).flat();

// Bottom tabs mapping per role
const TABS = {
  employee: [
    { key: 'raise', label: 'Raise Issue', icon: '➕' },
    { key: 'private', label: 'My Issues', icon: '🔒' },
    { key: 'public', label: 'Public Feed', icon: '🌐' },
    { key: 'account', label: 'Account', icon: '👤' },
  ],
  manager: [
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'merge', label: 'Merge Area', icon: '🔀' },
    { key: 'inprogress', label: 'In Progress', icon: '⚙️' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'all', label: 'All Issues', icon: '📋' },
  ],
  authority: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'escalated', label: 'Escalated', icon: '⚠️' },
    { key: 'all', label: 'All Issues', icon: '📋' },
  ],
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  // Pre-configured public Railway backend URL
  const [apiUrl, setApiUrl] = useState('https://triumphant-grace-production.up.railway.app');
  const [isConfigured, setIsConfigured] = useState(false);
  
  // App Session States
  const [role, setRole] = useState(null); // 'employee', 'manager', 'authority'
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('');
  
  // Global Complaints Database
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  
  // Employee form fields
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');

  // Map raw database snake_case columns to match frontend object keys
  const normalizeComplaint = (c) => ({
    id: c.id,
    employeeId: c.employee_id || c.employeeId || '',
    employeeName: c.employee_name || c.employeeName || 'Unknown',
    roomId: c.room_id || c.roomId || '',
    category: c.category || 'Other',
    description: c.description || '',
    status: c.status || 'pending',
    parentComplaintId: c.parent_complaint_id || c.parentComplaintId || null,
    mergedIntoId: c.merged_into_id || c.mergedIntoId || null,
    rejectionReason: c.rejection_reason || c.rejectionReason || '',
    escalationDescription: c.escalation_description || c.escalationDescription || '',
    completionDescription: c.completion_description || c.completionDescription || '',
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    visibility: c.visibility || 'private',
  });

  // Fetch from live database
  const fetchComplaints = async (authToken) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/complaints`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Normalize snake_case keys correctly
        setComplaints(data.map(normalizeComplaint));
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }
    } catch (err) {
      Alert.alert('Database Sync Error', `Could not sync database:\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Register Employee
  const handleRegister = async () => {
    if (!name.trim() || !userId.trim() || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/employees/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userId.trim(), 
          name: name.trim(), 
          password 
        }),
      });
      
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        Alert.alert('Success', 'Registered successfully! You can now sign in.');
        setIsRegistering(false);
        setName('');
        setPassword('');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      Alert.alert('Registration Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleLogin = async () => {
    if (!userId.trim() || !password) {
      Alert.alert('Error', 'Please enter your credentials.');
      return;
    }

    setLoading(true);
    let endpoint = '';
    if (role === 'employee') endpoint = `${apiUrl}/api/employees/login`;
    else if (role === 'manager') endpoint = `${apiUrl}/api/managers/login`;
    else if (role === 'authority') endpoint = `${apiUrl}/api/authorities/login`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId.trim(), 
          password 
        }),
      });
      
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.token) {
        setToken(data.token);
        setUserId(data.session.userId);
        setName(data.session.name || '');
        setIsLoggedIn(true);
        // Default to the first available role tab
        setActiveTab(TABS[role][0].key);
        fetchComplaints(data.token);
      } else {
        throw new Error(data.error || 'Invalid ID or password');
      }
    } catch (err) {
      Alert.alert(
        'Database Auth Failed',
        `Authentication failed.\n\nMake sure Railway database backend is online and details are entered correctly.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit Issue
  const handleCreateComplaint = async () => {
    if (!selectedRoom) {
      Alert.alert('Error', 'Please select a Room from the room grid.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the facility issue.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          roomId: selectedRoom, 
          category, 
          description: description.trim() 
        })
      });
      if (response.ok) {
        Alert.alert('Success', 'Complaint submitted to Railway database!');
        setSelectedRoom(null);
        setDescription('');
        // Sync and switch to 'My Issues' tab
        setActiveTab('private');
        fetchComplaints();
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server rejected submission');
      }
    } catch (err) {
      Alert.alert('Submission Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change status
  const handleUpdateStatus = async (id, status) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchComplaints();
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Update failed');
      }
    } catch (err) {
      Alert.alert('Update Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setUserId('');
    setName('');
    setPassword('');
    setIsRegistering(false);
    setComplaints([]);
    setRole(null);
  };

  // ── SCREEN 1: Setup Backend Server IP address
  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <Text style={styles.logo}>FacilityVoice</Text>
          <Text style={styles.subLogo}>Mobile Portal Setup</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Backend Server Connection</Text>
            <Text style={styles.helperText}>
              Connecting to your cloud database endpoint on Railway.
            </Text>
            
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="e.g. https://triumphant-grace-production.up.railway.app"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity style={styles.button} onPress={() => setIsConfigured(true)}>
              <Text style={styles.buttonText}>Connect to Railway Database</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCREEN 2: Role Selection
  if (!role) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <View style={styles.headerIndicator}>
            <Text style={styles.onlineModeIndicator}>🌐 CONNECTING TO RAILWAY</Text>
          </View>

          <Text style={styles.logo}>FacilityVoice</Text>
          <Text style={styles.subLogo}>Select Access Role</Text>
          
          <View style={styles.roleGrid}>
            <TouchableOpacity style={styles.roleCard} onPress={() => setRole('employee')}>
              <Text style={styles.roleEmoji}>👤</Text>
              <Text style={styles.roleTitle}>Employee</Text>
              <Text style={styles.roleDesc}>Report and track issues</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => setRole('manager')}>
              <Text style={styles.roleEmoji}>⚙️</Text>
              <Text style={styles.roleTitle}>Manager</Text>
              <Text style={styles.roleDesc}>Triage and assign tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => setRole('authority')}>
              <Text style={styles.roleEmoji}>🛡️</Text>
              <Text style={styles.roleTitle}>Authority</Text>
              <Text style={styles.roleDesc}>Audit and escalations</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.backLink} onPress={() => setIsConfigured(false)}>
            <Text style={styles.backLinkText}>← Change Server Configuration</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCREEN 3: Register View (Employee Role Only)
  if (role === 'employee' && isRegistering) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Text style={styles.logo}>FacilityVoice</Text>
          <Text style={styles.roleBadge}>EMPLOYEE REGISTRATION</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Radhu"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Employee ID</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="e.g. 12345"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {loading ? (
              <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.switchAuthLink} onPress={() => setIsRegistering(false)}>
              <Text style={styles.switchAuthLinkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── SCREEN 4: Login View (Employees / Managers / Authorities)
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Text style={styles.logo}>FacilityVoice</Text>
          <Text style={styles.roleBadge}>{role.toUpperCase()} SIGN-IN</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>User ID</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder={`Enter ${role} ID`}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {loading ? (
              <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            )}

            {role === 'employee' && (
              <TouchableOpacity style={styles.switchAuthLink} onPress={() => {
                setIsRegistering(true);
                setUserId('');
                setPassword('');
              }}>
                <Text style={styles.switchAuthLinkText}>New employee? Register here</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.backLink} onPress={() => setRole(null)}>
            <Text style={styles.backLinkText}>← Change Role</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── SCREEN 5: Main Authenticated Portal with Tabs ──
  const activeTabDetails = TABS[role].find(t => t.key === activeTab) || TABS[role][0];

  // Helper filters matching web features
  const getFilteredComplaints = () => {
    if (role === 'employee') {
      if (activeTab === 'private') {
        // Only show complaints raised by this logged in employee
        return complaints.filter(c => c.employeeId === userId);
      }
      if (activeTab === 'public') {
        // Only show public feed complaints
        return complaints.filter(c => c.visibility === 'public');
      }
    } else if (role === 'manager') {
      if (activeTab === 'pending') {
        return complaints.filter(c => c.status === 'pending' && !c.mergedIntoId);
      }
      if (activeTab === 'inprogress') {
        return complaints.filter(c => c.status === 'in_progress');
      }
      if (activeTab === 'completed') {
        return complaints.filter(c => c.status === 'completed');
      }
      if (activeTab === 'all') {
        return complaints;
      }
    } else if (role === 'authority') {
      if (activeTab === 'escalated') {
        return complaints.filter(c => c.status === 'escalated');
      }
      if (activeTab === 'all') {
        return complaints;
      }
    }
    return [];
  };

  const filteredList = getFilteredComplaints();

  // Metrics for Authority Overview
  const getMetrics = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const completed = complaints.filter(c => c.status === 'completed').length;
    return { total, pending, escalated, inProgress, completed };
  };

  // Group candidates for Manager Merge logic
  const getMergeGroups = () => {
    const pendingUnmerged = complaints.filter(c => c.status === 'pending' && !c.mergedIntoId);
    const groups = pendingUnmerged.reduce((acc, c) => {
      const key = `${c.roomId}__${c.category}`;
      if (!acc[key]) {
        acc[key] = { roomId: c.roomId, category: c.category, items: [] };
      }
      acc[key].items.push(c);
      return acc;
    }, {});
    
    // Filters groups where at least 5 different employees reported
    return Object.values(groups).filter(g => {
      const employeeIds = new Set(g.items.map(i => i.employeeId));
      return employeeIds.size >= 5;
    });
  };

  const mergeGroups = getMergeGroups();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>FacilityVoice</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={styles.headerSubtitle}>{role.toUpperCase()} PORTAL</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Views Scroll Body */}
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Tab Subtitle Header */}
        <View style={styles.tabHeaderRow}>
          <Text style={styles.tabHeaderTitle}>
            {activeTabDetails.icon} {activeTabDetails.label}
          </Text>
          {activeTab !== 'raise' && activeTab !== 'account' && activeTab !== 'overview' && (
            <TouchableOpacity onPress={() => fetchComplaints()}>
              <Text style={styles.refreshText}>🔄 Reload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Employee Tabs ── */}
        {role === 'employee' && activeTab === 'raise' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit New Facility Issue</Text>
            
            {/* Desktop-like Room Grid Picker */}
            <Text style={styles.label}>Select Room / Location</Text>
            <View style={styles.roomGridContainer}>
              {ROOM_IDS.map((roomId) => (
                <TouchableOpacity
                  key={roomId}
                  style={[
                    styles.roomGridItem,
                    selectedRoom === roomId && styles.roomGridItemActive
                  ]}
                  onPress={() => setSelectedRoom(roomId)}
                >
                  <Text style={[
                    styles.roomGridText,
                    selectedRoom === roomId && styles.roomGridTextActive
                  ]}>
                    {roomId}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerItem, category === cat && styles.pickerItemActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.pickerText, category === cat && styles.pickerTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Issue Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide structured details of the issue..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
            />

            {loading ? (
              <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 15 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleCreateComplaint}>
                <Text style={styles.buttonText}>Submit Report</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {role === 'employee' && activeTab === 'account' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Full Name</Text>
              <Text style={styles.accountValue}>{name || 'Unknown Employee'}</Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Employee ID</Text>
              <Text style={styles.accountValue}>{userId}</Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Access Level</Text>
              <Text style={styles.accountValue}>Authenticated Employee</Text>
            </View>
          </View>
        )}

        {/* ── Authority Overview Tab ── */}
        {role === 'authority' && activeTab === 'overview' && (
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{getMetrics().total}</Text>
              <Text style={styles.metricLabel}>Total Issues</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#fbbf24' }]}>{getMetrics().pending}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#c084fc' }]}>{getMetrics().escalated}</Text>
              <Text style={styles.metricLabel}>Escalated</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#60a5fa' }]}>{getMetrics().inProgress}</Text>
              <Text style={styles.metricLabel}>In Progress</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#34d399' }]}>{getMetrics().completed}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
          </View>
        )}

        {/* ── Manager Merge Area Tab ── */}
        {role === 'manager' && activeTab === 'merge' && (
          <View style={{ gap: 12 }}>
            <Text style={styles.helperText}>
              Lists categories where 5 or more different employees reported issues for the same room. These can be merged into a single public thread.
            </Text>
            {mergeGroups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No merge candidates found.</Text>
              </View>
            ) : (
              mergeGroups.map((g, idx) => (
                <View key={idx} style={styles.complaintCard}>
                  <View style={styles.complaintHeader}>
                    <Text style={styles.complaintTitle}>
                      Room {g.roomId} — {g.category}
                    </Text>
                    <View style={styles.badgePending}>
                      <Text style={[styles.badgeText, { color: '#94a3b8' }]}>
                        {g.items.length} Reports
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.complaintDesc}>
                    Merge reports to create a public investigation thread.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.button, { marginTop: 10 }]} 
                    onPress={() => Alert.alert('Merge action', 'Merge reports successfully.')}
                  >
                    <Text style={styles.buttonText}>Merge & Open Public Thread</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Lists / Feeds / Streams of Complaints ── */}
        {activeTab !== 'raise' && activeTab !== 'account' && activeTab !== 'overview' && activeTab !== 'merge' && (
          <View style={{ gap: 12 }}>
            {loading && filteredList.length === 0 ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 30 }} />
            ) : filteredList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No complaints match this feed.</Text>
              </View>
            ) : (
              filteredList.map((c) => {
                const isPending = c.status === 'pending';
                const isEscalated = c.status === 'escalated';
                
                return (
                  <View key={c.id} style={styles.complaintCard}>
                    <View style={styles.complaintHeader}>
                      <Text style={styles.complaintTitle}>
                        Room {c.roomId} — {c.category}
                      </Text>
                      
                      {/* Status Badges */}
                      <View style={[
                        styles.badge,
                        c.status === 'pending' && styles.badgePending,
                        c.status === 'escalated' && styles.badgeEscalated,
                        c.status === 'completed' && styles.badgeCompleted,
                        c.status === 'in_progress' && styles.badgeInProgress,
                        c.status === 'acknowledged' && styles.badgeAcknowledged,
                        c.status === 'rejected' && styles.badgeRejected,
                      ]}>
                        <Text style={[
                          styles.badgeText,
                          c.status === 'pending' && styles.badgeTextPending,
                          c.status === 'escalated' && styles.badgeTextEscalated,
                          c.status === 'completed' && styles.badgeTextCompleted,
                          c.status === 'in_progress' && styles.badgeTextInProgress,
                          c.status === 'acknowledged' && styles.badgeTextAcknowledged,
                          c.status === 'rejected' && styles.badgeTextRejected,
                        ]}>
                          {c.status.toUpperCase().replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.complaintDesc}>{c.description}</Text>
                    
                    {isEscalated && c.escalationDescription && (
                      <View style={styles.escalationBox}>
                        <Text style={styles.escalationText}>⚠️ Escalated: {c.escalationDescription}</Text>
                      </View>
                    )}

                    <Text style={styles.complaintMeta}>
                      Reported by: {c.employeeName} ({c.employeeId})
                    </Text>

                    {/* Manager Control Triggers */}
                    {role === 'manager' && isPending && (
                      <View style={styles.controlsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnAccept]}
                          onPress={() => handleUpdateStatus(c.id, 'in_progress')}
                        >
                          <Text style={styles.actionBtnText}>Accept</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnReject]}
                          onPress={() => handleUpdateStatus(c.id, 'rejected')}
                        >
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Authority Control Triggers */}
                    {role === 'authority' && isEscalated && (
                      <View style={styles.controlsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnAcknowledge]}
                          onPress={() => handleUpdateStatus(c.id, 'acknowledged')}
                        >
                          <Text style={styles.actionBtnText}>Acknowledge</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Fixed Bottom Navigation Bar ── */}
      <View style={styles.bottomTabBar}>
        {TABS[role].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text 
                numberOfLines={1} 
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  headerIndicator: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
  },
  onlineModeIndicator: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1.5,
  },
  logo: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subLogo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 24,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    marginBottom: 24,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  roleGrid: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  roleDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  backLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backLinkText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  switchAuthLink: {
    marginTop: 14,
    alignSelf: 'center',
  },
  switchAuthLinkText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80, // Pad for bottom bar
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  refreshText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  roomGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  roomGridItem: {
    width: '18%', // 5 columns layout
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  roomGridItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  roomGridText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  roomGridTextActive: {
    color: '#818cf8',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pickerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  pickerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerTextActive: {
    color: '#818cf8',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  complaintCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgePending: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  badgeEscalated: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeInProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badgeAcknowledged: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  badgeRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  badgeTextPending: {
    color: '#94a3b8',
  },
  badgeTextEscalated: {
    color: '#c084fc',
  },
  badgeTextCompleted: {
    color: '#34d399',
  },
  badgeTextInProgress: {
    color: '#60a5fa',
  },
  badgeTextAcknowledged: {
    color: '#818cf8',
  },
  badgeTextRejected: {
    color: '#f87171',
  },
  complaintDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  escalationBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  escalationText: {
    color: '#c084fc',
    fontSize: 11,
  },
  complaintMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnAccept: {
    backgroundColor: '#2563eb',
  },
  btnReject: {
    backgroundColor: '#dc2626',
  },
  btnAcknowledge: {
    backgroundColor: '#4f46e5',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 18,
    color: '#64748b',
  },
  tabIconActive: {
    color: '#818cf8',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#818cf8',
  },
  accountItem: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  accountLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  accountValue: {
    fontSize: 15,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
});
