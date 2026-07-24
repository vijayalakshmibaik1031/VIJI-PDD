import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';

function formatFloorName(floorNum) {
  if (floorNum === undefined || floorNum === null || floorNum === '') return 'N/A';
  const num = parseInt(floorNum, 10);
  if (isNaN(num)) return `Floor ${floorNum}`;
  if (num === 0) return 'Ground Floor';
  if (num === 1) return '1st Floor';
  if (num === 2) return '2nd Floor';
  if (num === 3) return '3rd Floor';
  return `${num}th Floor`;
}

export const AuthorityUsersScreen = () => {
  const {
    employees,
    managers,
    fetchEmployees,
    fetchManagers,
    updateManager,
    deleteManager,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    loading,
  } = useComplaints();

  const [activeTab, setActiveTab] = useState('managers');
  const [modalVisible, setModalVisible] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, [fetchEmployees, fetchManagers]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setModalVisible(true);
  };

  const handleOpenEdit = (userObj) => {
    setEditingUser(userObj);
    setUserName(userObj.name);
    setUserEmail(userObj.email || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter Name and Corporate Email');
      return;
    }
    if (!userEmail.trim().toLowerCase().endsWith('@xyzcompany.com')) {
      Alert.alert('Validation Error', 'Email must end with @xyzcompany.com');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'managers') {
        if (editingUser) {
          await updateManager(editingUser.id, userName.trim(), userEmail.trim().toLowerCase());
          Alert.alert('Success', 'Manager account updated.');
        }
      } else {
        if (editingUser) {
          await updateEmployee(editingUser.id, userName.trim(), userEmail.trim().toLowerCase());
          Alert.alert('Success', 'Employee account updated.');
        } else {
          const res = await createEmployee(userName.trim(), userEmail.trim().toLowerCase());
          Alert.alert('Success', `Employee created! Assigned ID: ${res.employeeId || res.id} (Default password: Welcome123$)`);
        }
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (userObj) => {
    Alert.alert('Confirm Delete', `Delete ${activeTab.slice(0, -1)} account "${userObj.name}" (${userObj.id})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (activeTab === 'managers') {
              await deleteManager(userObj.id);
            } else {
              await deleteEmployee(userObj.id);
            }
            Alert.alert('Deleted', 'Account removed successfully.');
          } catch (err) {
            Alert.alert('Error', err.message || 'Deletion failed');
          }
        },
      },
    ]);
  };

  const rawData = activeTab === 'managers' ? managers : employees;
  const filteredData = rawData.filter(
    (u) =>
      String(u.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Organization User Directory" subtitle="Authority control for Floor Managers and Employees" />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'managers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('managers')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'managers' && styles.tabBtnTextActive]}>
            Floor Managers ({managers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'employees' && styles.tabBtnActive]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'employees' && styles.tabBtnTextActive]}>
            Employees ({employees.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by ID, Name, or Email..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {activeTab === 'employees' ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Text style={styles.addBtnText}>+ Add Employee</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              🏢 Managers are created when adding floors under "Manage Rooms".
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userId}>ID: #{item.id}</Text>
                <Text style={styles.userEmail}>📧 {item.email || 'No email registered'}</Text>
                {activeTab === 'managers' && (
                  <View style={styles.floorBadge}>
                    <Text style={styles.floorBadgeText}>🏢 Managed Floor: {formatFloorName(item.floor_number)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                fetchEmployees();
                fetchManagers();
              }}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Accounts Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'No records match your search query.' : `No ${activeTab} registered in database.`}
              </Text>
            </View>
          }
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? `✏️ Edit ${activeTab.slice(0, -1)}` : `➕ Add Employee`}
            </Text>
            <Text style={styles.modalSub}>
              {editingUser ? `Updating details for ID: ${editingUser.id}` : 'Employee ID will be auto-generated starting with emp[8 digits]:'}
            </Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor="#64748B"
              value={userName}
              onChangeText={setUserName}
            />

            <Text style={styles.label}>Corporate Email (@xyzcompany.com) *</Text>
            <TextInput
              style={styles.input}
              placeholder="user@xyzcompany.com"
              placeholderTextColor="#64748B"
              value={userEmail}
              onChangeText={setUserEmail}
              autoCapitalize="none"
            />

            {!editingUser && (
              <View style={styles.infoNotice}>
                <Text style={styles.infoNoticeText}>
                  ℹ️ Employee ID will be auto-generated (e.g. emp48392015). Default password is <Text style={styles.codeText}>Welcome123$</Text>.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                <Text style={styles.saveText}>{submitting ? 'Saving...' : 'Save Employee'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  topBar: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  searchInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  infoBanner: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 10,
    borderRadius: 10,
  },
  infoBannerText: { color: '#818CF8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flex: 1, gap: 3 },
  userName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  userId: { color: '#818CF8', fontSize: 12, fontWeight: '600' },
  userEmail: { color: '#94A3B8', fontSize: 12 },
  floorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  floorBadgeText: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  userActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#94A3B8', fontSize: 14, marginTop: 6, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: '#CBD5E1', fontSize: 12, marginBottom: 14 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
  },
  infoNotice: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  infoNoticeText: { color: '#CBD5E1', fontSize: 11 },
  codeText: { color: '#818CF8', fontWeight: '700' },
  disabledInput: { color: '#64748B' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#4F46E5' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});
