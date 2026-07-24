import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../components/ComplaintCard'; // We exported formatRelativeTime from ComplaintCard.js

function buildThreads(complaints, employeeId) {
  const mine = complaints
    .filter((c) => String(c.employee_id || c.employeeId || '').toLowerCase() === String(employeeId).toLowerCase())
    .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));

  const childToRoot = {};
  function getRootId(c) {
    if (!c.parent_complaint_id && !c.parentComplaintId) return c.id;
    if (childToRoot[c.id]) return childToRoot[c.id];
    const parentId = c.parent_complaint_id || c.parentComplaintId;
    const parent = mine.find((x) => x.id === parentId);
    const root = parent ? getRootId(parent) : c.id;
    childToRoot[c.id] = root;
    return root;
  }

  const threads = {};

  mine.forEach((c) => {
    const rootId = getRootId(c);
    if (!threads[rootId]) threads[rootId] = [];
    threads[rootId].push(c);
  });

  return Object.values(threads).sort((a, b) => {
    const aLast = new Date(a[a.length - 1].created_at || a[a.length - 1].createdAt);
    const bLast = new Date(b[b.length - 1].created_at || b[b.length - 1].createdAt);
    return bLast - aLast;
  });
}

export const EmployeePrivateScreen = () => {
  const { complaints, fetchComplaints, createComplaint, recomplain, submitFeedback, loading } = useComplaints();
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('ongoing'); // ongoing or completed
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recomplainModalVisible, setRecomplainModalVisible] = useState(false);
  const [recomplainDescription, setRecomplainDescription] = useState('');
  const [recomplainedIds, setRecomplainedIds] = useState({});
  
  const [expandedThreads, setExpandedThreads] = useState({});
  const [feedbackTexts, setFeedbackTexts] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const currentEmpId = user?.id || user?.userId || 'emp001';
  const currentEmpName = user?.name || user?.username || 'Employee';

  const threads = buildThreads(complaints, currentEmpId);

  const hasReComplainedFor = (id) => !!recomplainedIds[id];

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
      await createComplaint({
        employeeId: currentEmpId,
        employeeName: currentEmpName,
        roomId: selectedComplaint.room_id || selectedComplaint.roomId,
        category: selectedComplaint.category,
        description: recomplainDescription.trim(),
        parentComplaintId: selectedComplaint.id,
      });

      const res = await recomplain(
        currentEmpId,
        selectedComplaint.room_id || selectedComplaint.roomId,
        selectedComplaint.category,
        selectedComplaint.id
      );

      setRecomplainedIds((prev) => ({ ...prev, [selectedComplaint.id]: true }));
      setRecomplainModalVisible(false);
      setSelectedComplaint(null);
      setRecomplainDescription('');

      if (res.escalated) {
        Alert.alert('Auto-Escalated', `Ticket auto-escalated to Authority.`);
      } else {
        Alert.alert('Re-Complain Logged', 'Your re-complaint has been submitted.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not log re-complaint');
    }
  };

  const handleFeedbackSubmit = async (complaintId) => {
    const text = feedbackTexts[complaintId];
    if (!text || !text.trim()) return;

    setSubmittingFeedback(prev => ({ ...prev, [complaintId]: true }));
    try {
      await submitFeedback(complaintId, text.trim());
      Alert.alert('Success', 'Feedback submitted successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  // Filter threads by date
  const filteredThreads = threads.filter((tc) => {
    const root = tc[0];
    const createdDate = new Date(root.created_at || root.createdAt);
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

  const ongoingThreads = filteredThreads.filter(tc => !tc.some(c => c.status === 'completed'));
  const completedThreads = filteredThreads.filter(tc => tc.some(c => c.status === 'completed'));
  const visibleThreads = activeSubTab === 'ongoing' ? ongoingThreads : completedThreads;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'escalated': return '#A855F7';
      case 'in-progress': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="My Private Complaints" subtitle="Track and manage issues raised by you" />
      
      {/* Sub Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeSubTab === 'ongoing' && styles.tabActive]}
          onPress={() => setActiveSubTab('ongoing')}
        >
          <Text style={[styles.tabText, activeSubTab === 'ongoing' && styles.tabTextActive]}>
            ONGOING ({ongoingThreads.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSubTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveSubTab('completed')}
        >
          <Text style={[styles.tabText, activeSubTab === 'completed' && styles.tabTextActive]}>
            COMPLETED ({completedThreads.length})
          </Text>
        </TouchableOpacity>
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
          data={visibleThreads}
          keyExtractor={(item) => String(item[0].id)}
          renderItem={({ item: tc }) => {
            const root = tc[0];
            const latest = tc[tc.length - 1];
            const key = root.id;
            const isExpanded = !!expandedThreads[key];

            const totalRejections = tc.reduce((s, c) => s + (c.rejectionHistory?.length || 0), 0);
            const reComplainCount = tc.filter((c) => hasReComplainedFor(c.id)).length;

            const escalatedComplaint = tc.find((c) => c.status === 'escalated');
            const isEscalated = !!escalatedComplaint;
            const isCompleted = tc.some((c) => c.status === 'completed');
            const latestIsRejected = latest.status === 'rejected';
            const latestAlreadyReComplained = hasReComplainedFor(latest.id);

            const displayStatus = isEscalated ? 'escalated' : latest.status;

            return (
              <View style={[styles.threadCard, isEscalated && styles.escalatedBorder]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardRoom}>Room {root.room_id || root.roomId}</Text>
                    <Text style={styles.cardCategory}>{root.category}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) }]}>
                      {displayStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Sub info */}
                <View style={styles.metaRow}>
                  {totalRejections > 0 && (
                    <Text style={[styles.metaText, styles.rejectionText]}>
                      {totalRejections} rejection{totalRejections !== 1 ? 's' : ''}
                    </Text>
                  )}
                  {reComplainCount > 0 && (
                    <Text style={[styles.metaText, styles.reComplainText]}>
                      {reComplainCount} re-complaint{reComplainCount !== 1 ? 's' : ''}
                    </Text>
                  )}
                  {tc.length > 1 && (
                    <TouchableOpacity
                      style={styles.toggleBtn}
                      onPress={() => setExpandedThreads((prev) => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <Text style={styles.toggleBtnText}>
                        {isExpanded ? '▲ Hide history' : `▼ History (${tc.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Description */}
                <Text style={styles.descriptionText}>{latest.description}</Text>
                <Text style={styles.timeText}>{formatRelativeTime(latest.created_at || latest.createdAt)}</Text>

                {/* Rejection notice */}
                {latestIsRejected && !isEscalated && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionBoxText}>
                      Manager reason: {latest.rejection_reason || latest.rejectionReason || 'No reason provided'}
                    </Text>
                  </View>
                )}

                {/* Escalated notice */}
                {isEscalated && (
                  <View style={styles.escalatedBox}>
                    <Text style={styles.escalatedBoxTitle}>▲ Escalated to Authority</Text>
                    <Text style={styles.escalatedBoxSub}>
                      This ticket has been escalated. Authority will review the case shortly.
                    </Text>
                  </View>
                )}

                {/* Completed notice */}
                {isCompleted && (
                  <View style={styles.completedBox}>
                    <Text style={styles.completedBoxTitle}>✓ Issue Resolved</Text>
                    {latest.completion_description || latest.completionDescription ? (
                      <Text style={styles.completedBoxSub}>
                        Note: {latest.completion_description || latest.completionDescription}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Feedback Section */}
                {isCompleted && (
                  <View style={styles.feedbackSection}>
                    {latest.feedbackText ? (
                      <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackBoxTitle}>💬 My Feedback:</Text>
                        <Text style={styles.feedbackBoxText}>{latest.feedbackText}</Text>
                      </View>
                    ) : (
                      <View style={styles.feedbackForm}>
                        <TextInput
                          style={styles.feedbackInput}
                          placeholder="Write feedback (optional)..."
                          placeholderTextColor="#64748B"
                          value={feedbackTexts[latest.id] || ''}
                          onChangeText={(t) => setFeedbackTexts((prev) => ({ ...prev, [latest.id]: t }))}
                        />
                        <TouchableOpacity
                          style={styles.feedbackBtn}
                          disabled={submittingFeedback[latest.id]}
                          onPress={() => handleFeedbackSubmit(latest.id)}
                        >
                          <Text style={styles.feedbackBtnText}>
                            {submittingFeedback[latest.id] ? '...' : 'Send'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Expanded history list */}
                {isExpanded && (
                  <View style={styles.historyContainer}>
                    {tc.map((c, idx) => (
                      <View key={c.id} style={styles.historyItem}>
                        <View style={styles.historyItemHeader}>
                          <Text style={styles.historyItemIndex}>#{idx + 1}</Text>
                          <Text style={[styles.historyStatus, { color: getStatusColor(c.status) }]}>
                            {c.status.toUpperCase()}
                          </Text>
                          <Text style={styles.historyTime}>{formatRelativeTime(c.created_at || c.createdAt)}</Text>
                        </View>
                        <Text style={styles.historyDesc}>{c.description}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Re-Complain button */}
                {latestIsRejected && !isEscalated && !isCompleted && (
                  <View style={styles.recomplainWrapper}>
                    {latestAlreadyReComplained ? (
                      <Text style={styles.recomplainPendingText}>✓ Re-Complained - Awaiting Review</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.recomplainBtn}
                        onPress={() => handleOpenRecomplain(latest)}
                      >
                        <Text style={styles.recomplainBtnText}>Re-Complain</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#6366F1" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Complaints Found</Text>
              <Text style={styles.emptySub}>No private complaints in this section.</Text>
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
  threadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  escalatedBorder: {
    borderColor: '#A855F7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardRoom: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  cardCategory: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rejectionText: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#F87171',
  },
  metaComplainText: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60A5FA',
  },
  toggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  toggleBtnText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '700',
  },
  descriptionText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
  },
  rejectionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  rejectionBoxText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  escalatedBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  escalatedBoxTitle: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  escalatedBoxSub: {
    color: '#E9D5FF',
    fontSize: 11,
  },
  completedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  completedBoxTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  completedBoxSub: {
    color: '#A7F3D0',
    fontSize: 11,
  },
  feedbackSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  feedbackBox: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  feedbackBoxTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedbackBoxText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  feedbackForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  feedbackInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  feedbackBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  feedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '750',
  },
  historyContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  historyItemIndex: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  historyStatus: {
    fontSize: 9,
    fontWeight: '800',
  },
  historyTime: {
    color: '#64748B',
    fontSize: 10,
  },
  historyDesc: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  recomplainWrapper: {
    marginTop: 10,
  },
  recomplainBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  recomplainBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  recomplainPendingText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
