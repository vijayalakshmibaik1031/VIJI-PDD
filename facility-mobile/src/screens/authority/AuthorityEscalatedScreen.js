import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { MergedGroupCard } from '../../components/MergedGroupCard';
import { useComplaints } from '../../context/ComplaintContext';

export const AuthorityEscalatedScreen = () => {
  const {
    complaints,
    mergedGroups,
    fetchComplaints,
    fetchMergedGroups,
    completeComplaint,
    completeMergedGroup,
    acknowledgeMergedGroup,
    loading,
  } = useComplaints();

  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [executiveNotes, setExecutiveNotes] = useState('');

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const escalatedTickets = complaints.filter(
    (c) => c.status?.toLowerCase() === 'escalated'
  );

  const escalatedGroups = mergedGroups.filter(
    (g) => g.status?.toLowerCase() === 'escalated'
  );

  const handleOpenCompleteTicket = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedGroup(null);
    setExecutiveNotes('');
    setCompleteModalVisible(true);
  };

  const handleOpenCompleteGroup = (group) => {
    setSelectedGroup(group);
    setSelectedTicket(null);
    setExecutiveNotes('');
    setCompleteModalVisible(true);
  };

  const handleConfirmComplete = async () => {
    try {
      if (selectedTicket) {
        await completeComplaint(
          selectedTicket.id,
          executiveNotes.trim() || 'Resolved by Executive Authority'
        );
        Alert.alert('Completed', `Escalated Ticket #${selectedTicket.id} marked as Completed.`);
      } else if (selectedGroup) {
        await completeMergedGroup(
          selectedGroup.id,
          executiveNotes.trim() || 'Resolved by Executive Authority'
        );
        Alert.alert('Completed', `Escalated Merged Group #${selectedGroup.id.slice(0, 8)} marked as Completed.`);
      }
      setCompleteModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not complete item');
    }
  };

  const handleAcknowledgeGroup = async (groupId) => {
    try {
      await acknowledgeMergedGroup(groupId);
      Alert.alert('Acknowledged', 'Merged Group acknowledged by Authority.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not acknowledge');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Authority Escalated Alerts" subtitle="High-priority executive governance queue" />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'tickets' && styles.tabBtnTextActive]}>
            Escalated Tickets ({escalatedTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'groups' && styles.tabBtnActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'groups' && styles.tabBtnTextActive]}>
            Escalated Groups ({escalatedGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'tickets' ? (
          <FlatList
            data={escalatedTickets}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                onComplete={handleOpenCompleteTicket}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => {
                  fetchComplaints();
                  fetchMergedGroups();
                }}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No Escalated Tickets</Text>
                <Text style={styles.emptySub}>All escalated individual complaints have been resolved.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={escalatedGroups}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <MergedGroupCard
                group={item}
                onAcknowledge={handleAcknowledgeGroup}
                onComplete={handleOpenCompleteGroup}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => {
                  fetchComplaints();
                  fetchMergedGroups();
                }}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No Escalated Groups</Text>
                <Text style={styles.emptySub}>All escalated merged groups have been resolved.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Completion Modal */}
      <Modal visible={completeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚖️ Executive Resolution Note</Text>
            <Text style={styles.modalSub}>
              Enter resolution summary for {selectedTicket ? `Ticket #${selectedTicket.id}` : `Group #${selectedGroup?.id.slice(0, 8)}`}:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Executive override approved emergency contractor repair..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={executiveNotes}
              onChangeText={setExecutiveNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCompleteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmComplete}>
                <Text style={styles.confirmText}>Mark Resolved</Text>
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
    backgroundColor: '#C026D3',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
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
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: '#CBD5E1', fontSize: 13, marginBottom: 12 },
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
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#16A34A' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
