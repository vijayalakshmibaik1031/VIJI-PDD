import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerInProgressScreen = () => {
  const { complaints, fetchComplaints, completeComplaint, escalateComplaint, loading } = useComplaints();

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);

  const [completionNotes, setCompletionNotes] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [escalationReason, setEscalateReason] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const inProgressList = complaints.filter(
    (c) => c.status?.toLowerCase() === 'in-progress' || c.status?.toLowerCase() === 'in_progress'
  );

  const handleOpenComplete = (complaint) => {
    setSelectedComplaint(complaint);
    setCompletionNotes('');
    setPhotoUri('');
    setCompleteModalVisible(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedComplaint) return;
    try {
      await completeComplaint(
        selectedComplaint.id,
        completionNotes.trim() || 'Work completed by Facility Team',
        photoUri.trim() || null
      );
      setCompleteModalVisible(false);
      setSelectedComplaint(null);
      Alert.alert('Completed', `Ticket #${selectedComplaint.id} marked as Completed.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not complete ticket');
    }
  };

  const handleOpenEscalate = (complaint) => {
    setSelectedComplaint(complaint);
    setEscalateReason('');
    setEscalateModalVisible(true);
  };

  const handleConfirmEscalate = async () => {
    if (!escalationReason.trim()) {
      Alert.alert('Validation Error', 'Please enter an escalation reason');
      return;
    }
    try {
      await escalateComplaint(selectedComplaint.id, escalationReason.trim());
      setEscalateModalVisible(false);
      setSelectedComplaint(null);
      Alert.alert('Escalated', `Ticket #${selectedComplaint.id} escalated to Authority.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not escalate ticket');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Active Maintenance Workspace" subtitle="Complete work orders or escalate to Authority" />
      <View style={styles.content}>
        <FlatList
          data={inProgressList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ComplaintCard
              complaint={item}
              onComplete={handleOpenComplete}
              onEscalate={handleOpenEscalate}
            />
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#6366F1" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Active Maintenance</Text>
              <Text style={styles.emptySub}>No tickets are currently marked as In Progress.</Text>
            </View>
          }
        />
      </View>

      {/* Complete Modal */}
      <Modal visible={completeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Complete Ticket Work</Text>
            <Text style={styles.modalSub}>Enter work completion notes for Ticket #{selectedComplaint?.id}:</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Replaced leaking valve and tested pressure..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={completionNotes}
              onChangeText={setCompletionNotes}
            />

            <Text style={styles.modalLabel}>Proof Photo Attachment (Optional URL / Path)</Text>
            <TextInput
              style={styles.singleInput}
              placeholder="https://... photo proof URL"
              placeholderTextColor="#64748B"
              value={photoUri}
              onChangeText={setPhotoUri}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCompleteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmCompleteBtn} onPress={handleConfirmComplete}>
                <Text style={styles.confirmText}>Mark Work Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Escalate Modal */}
      <Modal visible={escalateModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚨 Escalate to Authority</Text>
            <Text style={styles.modalSub}>State reason for escalating Ticket #{selectedComplaint?.id} to Authority:</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Major structural repair required exceeding budget..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={escalationReason}
              onChangeText={setEscalateReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEscalateModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEscalateBtn} onPress={handleConfirmEscalate}>
                <Text style={styles.confirmText}>Confirm Escalation</Text>
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
  modalLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  singleInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  confirmCompleteBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#16A34A' },
  confirmEscalateBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#C026D3' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
