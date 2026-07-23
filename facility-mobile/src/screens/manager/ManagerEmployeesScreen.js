import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerEmployeesScreen = () => {
  const { employees, fetchEmployees, createEmployee, updateEmployee, deleteEmployee, loading } = useComplaints();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setEmpId('');
    setEmpName('');
    setEmpEmail('');
    setModalVisible(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setEmpId(emp.id);
    setEmpName(emp.name);
    setEmpEmail(emp.email || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!empId.trim() || !empName.trim() || !empEmail.trim()) {
      Alert.alert('Validation Error', 'Please fill in Employee ID, Name, and Corporate Email');
      return;
    }
    if (!empEmail.trim().toLowerCase().endsWith('@xyzcompany.com')) {
      Alert.alert('Validation Error', 'Email must end with @xyzcompany.com');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEmp) {
        await updateEmployee(empId.trim(), empName.trim(), empEmail.trim().toLowerCase());
        Alert.alert('Success', 'Employee account updated successfully.');
      } else {
        await createEmployee(empId.trim(), empName.trim(), empEmail.trim().toLowerCase());
        Alert.alert('Success', 'Employee created with default password Welcome123$');
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (emp) => {
    Alert.alert('Confirm Delete', `Delete employee account "${emp.name}" (${emp.id})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee(emp.id);
            Alert.alert('Deleted', 'Employee account removed.');
          } catch (err) {
            Alert.alert('Error', err.message || 'Deletion failed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Employee Roster Management" subtitle="Create and manage organization employee accounts" />
      
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Text style={styles.addBtnText}>+ Add New Employee Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.empCard}>
              <View style={styles.empInfo}>
                <Text style={styles.empName}>{item.name}</Text>
                <Text style={styles.empId}>ID: #{item.id}</Text>
                <Text style={styles.empEmail}>📧 {item.email || 'No email attached'}</Text>
              </View>
              <View style={styles.empActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEmployees} tintColor="#6366F1" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Employee Accounts</Text>
              <Text style={styles.emptySub}>No employees found in organization roster.</Text>
            </View>
          }
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingEmp ? '✏️ Edit Employee Account' : '➕ Add Employee Account'}</Text>
            <Text style={styles.modalSub}>
              {editingEmp ? 'Update employee profile details:' : 'Default password will be Welcome123$:'}
            </Text>

            <Text style={styles.label}>Employee ID *</Text>
            <TextInput
              style={[styles.input, editingEmp && styles.disabledInput]}
              placeholder="e.g. emp002"
              placeholderTextColor="#64748B"
              value={empId}
              onChangeText={setEmpId}
              editable={!editingEmp}
            />

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#64748B"
              value={empName}
              onChangeText={setEmpName}
            />

            <Text style={styles.label}>Corporate Email (@xyzcompany.com) *</Text>
            <TextInput
              style={styles.input}
              placeholder="employee@xyzcompany.com"
              placeholderTextColor="#64748B"
              value={empEmail}
              onChangeText={setEmpEmail}
              autoCapitalize="none"
            />

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
  topBar: { paddingHorizontal: 16, paddingTop: 12 },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  empCard: {
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
  empInfo: { flex: 1, gap: 2 },
  empName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  empId: { color: '#818CF8', fontSize: 12, fontWeight: '600' },
  empEmail: { color: '#94A3B8', fontSize: 12 },
  empActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#94A3B8', fontSize: 14, marginTop: 6 },
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
  disabledInput: { color: '#64748B' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#4F46E5' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});
