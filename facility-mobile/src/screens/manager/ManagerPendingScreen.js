import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerPendingScreen = () => {
  const { complaints, fetchComplaints, updateComplaintStatus, raiseToPublic, rejectComplaint, loading } = useComplaints();

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const pendingList = complaints.filter(
    (c) => c.status?.toLowerCase() === 'pending' && c.status?.toLowerCase() !== 'merged_public'
  );

  const handleApprove = async (complaint) => {
    try {
      await updateComplaintStatus(complaint.id, 'in-progress');
      Alert.alert('Approved', `Ticket #${complaint.id} marked as In Progress.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update status');
    }
  };

  const handleRaiseToPublic = async (complaintId) => {
    try {
      await raiseToPublic(complaintId);
      Alert.alert('Public Feed', 'Ticket raised to Public Visibility for community endorsements.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not raise to public');
    }
  };

  const handleOpenReject = (complaint) => {
    setSelectedComplaint(complaint);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      Alert.alert('Validation Error', 'Rejection reason is required (minimum 5 characters)');
      return;
    }
    try {
      const res = await rejectComplaint(selectedComplaint.id, rejectReason.trim());
      setRejectModalVisible(false);
      setSelectedComplaint(null);
      if (res.escalated) {
        Alert.alert('Auto-Escalated', `Ticket escalated to Authority after 5 total rejections.`);
      } else {
        Alert.alert('Rejected', `Ticket #${selectedComplaint.id} marked as Rejected.`);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reject ticket');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Pending Tickets Queue" subtitle="Approve, reject, or publish incoming complaints" />
      <View style={styles.content}>
        <FlatList
          data={pendingList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isPublic = item.visibility === 'public';
            return (
              <ComplaintCard
                complaint={item}
                onApprove={!isPublic ? handleApprove : null}
                onRaiseToPublic={!isPublic ? handleRaiseToPublic : null}
                onReject={!isPublic ? handleOpenReject : null}
                isPublic={isPublic}
              />
            );
          }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#6366F1" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Pending Complaints</Text>
              <Text style={styles.emptySub}>All reported facility issues have been processed.</Text>
            </View>
          }
        />
      </View>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>❌ Reject Complaint Ticket</Text>
            <Text style={styles.modalSub}>Provide an explicit reason for rejecting Ticket #{selectedComplaint?.id}:</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Minimum 5 characters required..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmRejectBtn} onPress={handleConfirmReject}>
                <Text style={styles.confirmText}>Confirm Rejection</Text>
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
  content: { flex: 1, padding: 16 },
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
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub: { color: '#CBD5E1', fontSize: 13, marginBottom: 12 },
  modalInput: {
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
  confirmRejectBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#DC2626' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
