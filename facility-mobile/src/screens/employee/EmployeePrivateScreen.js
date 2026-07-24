import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';

export const EmployeePrivateScreen = () => {
  const { complaints, fetchComplaints, createComplaint, recomplain, loading } = useComplaints();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recomplainModalVisible, setRecomplainModalVisible] = useState(false);
  const [recomplainDescription, setRecomplainDescription] = useState('');
  const [recomplainedIds, setRecomplainedIds] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const currentEmpId = user?.id || user?.userId || 'emp001';
  const currentEmpName = user?.name || user?.username || 'Employee';

  const myComplaints = complaints.filter(
    (c) => String(c.employee_id || c.employeeId || '').toLowerCase() === String(currentEmpId).toLowerCase()
  );

  const filteredList = myComplaints.filter((c) => {
    if (filter !== 'all' && c.status?.toLowerCase() !== filter) return false;

    const createdDate = new Date(c.created_at || c.createdAt);
    if (!isNaN(createdDate.getTime())) {
      const y = createdDate.getFullYear().toString();
      const m = (createdDate.getMonth() + 1).toString();
      const d = createdDate.getDate().toString();

      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== parseInt(filterMonth, 10).toString()) return false;
      if (filterDay && d !== parseInt(filterDay, 10).toString()) return false;
    }
    return true;
  });

  const handleOpenRecomplain = (complaint) => {
    setSelectedComplaint(complaint);
    setRecomplainDescription(complaint.description || '');
    setRecomplainModalVisible(true);
  };

  const handleConfirmRecomplain = async () => {
    if (!selectedComplaint) return;
    if (!recomplainDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description for your re-complaint');
      return;
    }

    try {
      // 1. Create a new complaint with parentComplaintId and updated description
      await createComplaint({
        employeeId: currentEmpId,
        employeeName: currentEmpName,
        roomId: selectedComplaint.room_id || selectedComplaint.roomId,
        category: selectedComplaint.category,
        description: recomplainDescription.trim(),
        parentComplaintId: selectedComplaint.id,
      });

      // 2. Mark the parent complaint as recomplained
      const res = await recomplain(
        currentEmpId,
        selectedComplaint.room_id || selectedComplaint.roomId,
        selectedComplaint.category,
        selectedComplaint.id
      );

      // 3. Update local state to disable further resubmission for this ticket
      setRecomplainedIds((prev) => ({ ...prev, [selectedComplaint.id]: true }));

      setRecomplainModalVisible(false);
      setSelectedComplaint(null);
      setRecomplainDescription('');

      if (res.escalated) {
        Alert.alert('Auto-Escalated', `Ticket auto-escalated to Authority after ${res.reComplaintCount} re-complaints.`);
      } else {
        Alert.alert('Re-Complain Logged', 'Your re-complaint and description have been submitted.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not log re-complaint');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="My Private Complaints" subtitle="Track and manage issues raised by you" />
      
      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {['all', 'pending', 'in-progress', 'completed', 'rejected'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Inputs Filter */}
      <View style={styles.dateFilterContainer}>
        <TextInput
          style={styles.dateInput}
          placeholder="Day (DD)"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={filterDay}
          onChangeText={setFilterDay}
          maxLength={2}
        />
        <TextInput
          style={styles.dateInput}
          placeholder="Month (MM)"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={filterMonth}
          onChangeText={setFilterMonth}
          maxLength={2}
        />
        <TextInput
          style={styles.dateInput}
          placeholder="Year (YYYY)"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={filterYear}
          onChangeText={setFilterYear}
          maxLength={4}
        />
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isRecomplained = recomplainedIds[item.id] || item.status === 'recomplained';
            return (
              <ComplaintCard
                complaint={item}
                currentUserId={currentEmpId}
                hasRecomplained={isRecomplained}
                onRecomplain={item.status === 'rejected' && !isRecomplained ? handleOpenRecomplain : null}
              />
            );
          }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#6366F1" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Complaints Found</Text>
              <Text style={styles.emptySub}>No issues match the selected filter tab.</Text>
            </View>
          }
        />
      </View>

      {/* Re-complain Modal */}
      <Modal visible={recomplainModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔄 Resubmit Re-Complain</Text>
            <Text style={styles.modalSub}>
              Resubmitting ticket for Room {selectedComplaint?.room_id || selectedComplaint?.roomId} ({selectedComplaint?.category}):
            </Text>

            <Text style={styles.label}>Comment / Updated Issue Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe what is still unresolved..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={recomplainDescription}
              onChangeText={setRecomplainDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRecomplainModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmRecomplain}>
                <Text style={styles.confirmText}>Confirm Resubmit</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: { flex: 1, padding: 16 },
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
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalSub: { color: '#CBD5E1', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#D97706' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
  dateFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
});
