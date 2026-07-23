import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, RefreshControl, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerMergeScreen = () => {
  const {
    complaints,
    mergedGroups,
    employees,
    fetchComplaints,
    fetchMergedGroups,
    createMergedGroup,
    escalateMergedGroup,
    escalateComplaint,
    loading,
  } = useComplaints();

  const [activeMergeCandidate, setActiveMergeCandidate] = useState(null);
  const [mergeDescription, setMergeDescription] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const [activeEscalateGroup, setActiveEscalateGroup] = useState(null);
  const [groupEscalationNote, setGroupEscalationNote] = useState('');

  const [activeEscalateComplaint, setActiveEscalateComplaint] = useState(null);
  const [complaintEscalationNote, setComplaintEscalationNote] = useState('');

  const [activeEndorsedDetails, setActiveEndorsedDetails] = useState(null); // { title: string, list: [] }

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  // Compute Auto-Merge Candidates (5+ complaints for same room & category from 5+ unique employees)
  const mergeCandidates = useMemo(() => {
    const unmerged = complaints.filter(
      (c) => c.status !== 'merged_public' && !c.merged_into_id && c.status !== 'completed' && c.status !== 'rejected'
    );

    const grouped = {};
    unmerged.forEach((item) => {
      const room = item.room_id || item.roomId;
      const cat = item.category;
      const key = `${room}-${cat}`;
      if (!grouped[key]) {
        grouped[key] = { roomId: room, category: cat, complaints: [] };
      }
      grouped[key].complaints.push(item);
    });

    return Object.values(grouped).filter((group) => {
      const uniqueEmps = new Set(group.complaints.map((c) => c.employee_id || c.employeeId));
      return group.complaints.length >= 5 && uniqueEmps.size >= 5;
    });
  }, [complaints]);

  // Public Individual Complaints
  const individualPublic = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.visibility === 'public' &&
        !c.parent_complaint_id &&
        !c.parentComplaintId &&
        !c.merged_into_id &&
        !c.mergedIntoId &&
        c.status !== 'completed' &&
        c.status !== 'rejected'
    );
  }, [complaints]);

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => String(e.id).toLowerCase() === String(empId).toLowerCase());
    return emp ? emp.name : empId;
  };

  const handleConfirmMerge = async () => {
    if (!activeMergeCandidate || !mergeDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a manager merge description.');
      return;
    }
    setIsMerging(true);
    try {
      const groupId = `GRP-${Date.now()}`;
      await createMergedGroup({
        id: groupId,
        roomId: activeMergeCandidate.roomId,
        category: activeMergeCandidate.category,
        managerDescription: mergeDescription.trim(),
        complaintIds: activeMergeCandidate.complaints.map((c) => c.id),
      });
      Alert.alert('Merged', 'Merged group created successfully and published.');
      setActiveMergeCandidate(null);
      setMergeDescription('');
    } catch (err) {
      Alert.alert('Merge Failed', err.message || 'Could not merge complaints.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleConfirmEscalateGroup = async () => {
    if (!activeEscalateGroup) return;
    try {
      await escalateMergedGroup(activeEscalateGroup.id, groupEscalationNote.trim() || 'Escalated to Authority');
      Alert.alert('Escalated', 'Merged group escalated to Authority.');
      setActiveEscalateGroup(null);
      setGroupEscalationNote('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Escalation failed');
    }
  };

  const handleConfirmEscalateComplaint = async () => {
    if (!activeEscalateComplaint) return;
    try {
      await escalateComplaint(activeEscalateComplaint.id, complaintEscalationNote.trim() || 'Escalated by Manager');
      Alert.alert('Escalated', 'Public complaint escalated to Authority.');
      setActiveEscalateComplaint(null);
      setComplaintEscalationNote('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Escalation failed');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Merge Area" subtitle="Auto-merge groups, merged issues, and public complaints" />

      <ScrollView
        contentContainerStyle={styles.container}
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
      >
        {/* ── Section 1: Auto-Merge Candidate Groups ── */}
        <Text style={styles.sectionTitle}>📦 Auto-Merge Candidates</Text>
        {!mergeCandidates.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>No auto-merge groups yet (need 5+ employees for same room and category).</Text>
          </View>
        ) : (
          mergeCandidates.map((group) => (
            <View key={`${group.roomId}-${group.category}`} style={styles.card}>
              <Text style={styles.cardHeaderTitle}>
                Room {group.roomId} — {group.category} ({group.complaints.length} complaints)
              </Text>
              <View style={styles.subList}>
                {group.complaints.map((c) => (
                  <Text key={c.id} style={styles.subListItem}>
                    • {c.employee_name || c.employeeName || c.employee_id}: {c.description}
                  </Text>
                ))}
              </View>
              <TouchableOpacity style={styles.actionBtnDark} onPress={() => setActiveMergeCandidate(group)}>
                <Text style={styles.actionBtnText}>Auto-Merge Complaints</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ── Section 2: Merged Groups ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📁 Merged Groups</Text>
        {!mergedGroups.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>No merged groups yet.</Text>
          </View>
        ) : (
          mergedGroups.map((group) => {
            const endorsedByList = Array.isArray(group.endorsed_by)
              ? group.endorsed_by
              : Array.isArray(group.endorsedBy)
              ? group.endorsedBy
              : [];
            const totalEndorsements = endorsedByList.length;
            const canEscalate = totalEndorsements >= 5 && group.status === 'merged_public';

            return (
              <View key={group.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardHeaderTitle}>
                    Room {group.room_id || group.roomId} — {group.category}
                  </Text>
                  <StatusBadge status={group.status || 'merged_public'} />
                </View>
                <Text style={styles.descText}>{group.manager_description || group.managerDescription}</Text>
                <Text style={styles.metaSub}>Total endorsements: {totalEndorsements}</Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      setActiveEndorsedDetails({
                        title: `Merged Group Endorsements (Room ${group.room_id || group.roomId})`,
                        list: endorsedByList,
                      })
                    }
                  >
                    <Text style={styles.detailsBtnText}>Endorsed details</Text>
                  </TouchableOpacity>

                  {canEscalate && (
                    <TouchableOpacity
                      style={styles.escalateBtn}
                      onPress={() => {
                        setActiveEscalateGroup(group);
                        setGroupEscalationNote('');
                      }}
                    >
                      <Text style={styles.escalateBtnText}>Escalate to Authority</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ── Section 3: Public Individual Complaints ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🌐 Public Individual Complaints</Text>
        {!individualPublic.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>No public individual complaints yet.</Text>
          </View>
        ) : (
          individualPublic.map((complaint) => {
            const endorsedByList = Array.isArray(complaint.endorsed_by)
              ? complaint.endorsed_by
              : Array.isArray(complaint.endorsedBy)
              ? complaint.endorsedBy
              : [];
            const totalEndorsements = endorsedByList.length;
            const canEscalate = totalEndorsements >= 5 && complaint.status === 'pending';

            return (
              <View key={complaint.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardHeaderTitle}>
                    Room {complaint.room_id || complaint.roomId} — {complaint.category}
                  </Text>
                  <StatusBadge status={complaint.status} />
                </View>
                <Text style={styles.descText}>{complaint.description}</Text>
                <Text style={styles.metaSub}>Submitted by: {complaint.employee_name || complaint.employeeName || complaint.employee_id}</Text>
                <Text style={styles.metaSub}>Total endorsements: {totalEndorsements}</Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      setActiveEndorsedDetails({
                        title: `Complaint Endorsements (Room ${complaint.room_id || complaint.roomId})`,
                        list: endorsedByList,
                      })
                    }
                  >
                    <Text style={styles.detailsBtnText}>Endorsed details</Text>
                  </TouchableOpacity>

                  {canEscalate && (
                    <TouchableOpacity
                      style={styles.escalateBtn}
                      onPress={() => {
                        setActiveEscalateComplaint(complaint);
                        setComplaintEscalationNote('');
                      }}
                    >
                      <Text style={styles.escalateBtnText}>Escalate to Authority</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Merge Modal */}
      <Modal visible={Boolean(activeMergeCandidate)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manager Merge Description</Text>
            <Text style={styles.modalSub}>
              Combining {activeMergeCandidate?.complaints.length} complaints for Room {activeMergeCandidate?.roomId} ({activeMergeCandidate?.category}):
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter Manager Overview Description for this Merged Group..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={mergeDescription}
              onChangeText={setMergeDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveMergeCandidate(null)} disabled={isMerging}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmMerge} disabled={isMerging}>
                <Text style={styles.confirmText}>{isMerging ? 'Merging...' : 'Confirm Merge'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Escalate Group Modal */}
      <Modal visible={Boolean(activeEscalateGroup)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escalate Merged Group to Authority</Text>
            <Text style={styles.modalSub}>Escalation note (optional):</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Reason for escalating to Authority..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={groupEscalationNote}
              onChangeText={setGroupEscalationNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveEscalateGroup(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.escalateConfirmBtn} onPress={handleConfirmEscalateGroup}>
                <Text style={styles.confirmText}>Confirm Escalate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Escalate Complaint Modal */}
      <Modal visible={Boolean(activeEscalateComplaint)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escalate Public Complaint to Authority</Text>
            <Text style={styles.modalSub}>Escalation note (optional):</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Reason for escalating to Authority..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={complaintEscalationNote}
              onChangeText={setComplaintEscalationNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveEscalateComplaint(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.escalateConfirmBtn} onPress={handleConfirmEscalateComplaint}>
                <Text style={styles.confirmText}>Confirm Escalate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Endorsed Employee Details Modal */}
      <Modal visible={Boolean(activeEndorsedDetails)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{activeEndorsedDetails?.title}</Text>

            {activeEndorsedDetails?.list && activeEndorsedDetails.list.length > 0 ? (
              <ScrollView style={{ maxHeight: 200, marginVertical: 12 }}>
                {activeEndorsedDetails.list.map((empId) => (
                  <View key={empId} style={styles.endorsedRow}>
                    <Text style={styles.endorsedText}>
                      👤 {getEmployeeName(empId)} ({empId})
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptySubModal}>No endorsements yet.</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveEndorsedDetails(null)}>
                <Text style={styles.cancelText}>Close</Text>
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
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardHeaderTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', flex: 1 },
  subList: { backgroundColor: '#0F172A', borderRadius: 8, padding: 10, marginVertical: 8, gap: 4 },
  subListItem: { color: '#CBD5E1', fontSize: 12 },
  actionBtnDark: { backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  descText: { color: '#CBD5E1', fontSize: 13, marginVertical: 4 },
  metaSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  detailsBtn: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  detailsBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  escalateBtn: { backgroundColor: '#C026D3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  escalateBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyBox: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  emptySub: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
  emptySubModal: { color: '#94A3B8', fontSize: 13, marginVertical: 16, textAlign: 'center' },
  endorsedRow: { backgroundColor: '#0F172A', borderRadius: 6, padding: 8, marginBottom: 6 },
  endorsedText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: '#CBD5E1', fontSize: 12, marginBottom: 12 },
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
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#4F46E5' },
  escalateConfirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#C026D3' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
