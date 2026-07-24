import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from './ComplaintCard';
import { useComplaints } from '../context/ComplaintContext';

export const MergedGroupCard = ({
  group,
  onEndorse,
  onAcknowledge,
  onComplete,
  onEscalate,
  currentUserId,
}) => {
  const { complaints } = useComplaints();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSinglePress = async (actionFn, param) => {
    if (isProcessing || !actionFn) return;
    setIsProcessing(true);
    try {
      await actionFn(param);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const constituentIds = typeof group.constituent_complaint_ids === 'string'
    ? JSON.parse(group.constituent_complaint_ids || '[]')
    : (group.constituent_complaint_ids || group.constituentComplaintIds || []);

  const endorsedBy = Array.isArray(group.endorsed_by) ? group.endorsed_by : (group.endorsedBy || []);
  const isEndorsed = currentUserId && endorsedBy.some(e => {
    if (typeof e === 'object' && e !== null) return String(e.employeeId) === String(currentUserId);
    return String(e) === String(currentUserId);
  });

  const groupItems = complaints.filter(
    (c) => constituentIds.includes(c.id) || constituentIds.includes(c.parentComplaintId) || constituentIds.includes(c.parent_complaint_id)
  );

  // Group items into threads
  const threads = React.useMemo(() => {
    const sorted = [...complaints].sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));
    const childToRoot = {};
    const getRootId = (c) => {
      if (!c.parentComplaintId && !c.parent_complaint_id) return c.id;
      const pId = c.parentComplaintId || c.parent_complaint_id;
      if (childToRoot[c.id]) return childToRoot[c.id];
      const parent = sorted.find((x) => x.id === pId);
      const root = parent ? getRootId(parent) : c.id;
      childToRoot[c.id] = root;
      return root;
    };

    const threadsMap = {};
    sorted.forEach((c) => {
      const rootId = getRootId(c);
      if (!threadsMap[rootId]) threadsMap[rootId] = [];
      threadsMap[rootId].push(c);
    });

    return Object.values(threadsMap);
  }, [complaints]);

  const renderWorkflowHistory = (tc) => {
    const events = [];

    tc.forEach((c, idx) => {
      events.push({
        title: idx === 0 ? '📝 Ticket Raised' : `🔄 Resubmitted Re-Complain #${idx}`,
        time: c.created_at || c.createdAt,
        desc: `Description: "${c.description}" by ${c.employee_name || c.employeeId || 'Employee'}`,
      });

      if (c.status === 'rejected' && (c.rejected_at || c.rejectedAt)) {
        events.push({
          title: '❌ Rejected by Manager',
          time: c.rejected_at || c.rejectedAt,
          desc: `Reason: "${c.rejection_reason || c.rejectionReason || 'No reason'}"`,
        });
      }

      const rejHist = c.rejectionHistory || c.rejection_history || [];
      if (Array.isArray(rejHist)) {
        rejHist.forEach((r) => {
          events.push({
            title: `❌ Rejected (Rejection #${r.count || 1})`,
            time: r.rejectedAt || c.rejected_at || c.rejectedAt,
            desc: `Reason: "${r.reason || 'No details'}"`,
          });
        });
      }

      if (c.status === 'escalated' && (c.escalated_at || c.escalatedAt)) {
        events.push({
          title: '🚨 Escalated to Authority',
          time: c.escalated_at || c.escalatedAt,
          desc: c.escalation_description || c.escalationDescription || 'Escalated.',
        });
      }

      if (c.status === 'completed' && (c.completed_at || c.completedAt)) {
        events.push({
          title: '✅ Completed & Resolved',
          time: c.completed_at || c.completedAt,
          desc: c.completion_description || c.completionDescription || 'Resolved.',
        });
      }

      if (c.feedback_text || c.feedbackText) {
        events.push({
          title: '💬 Feedback Submitted',
          time: c.feedback_submitted_at || c.feedbackSubmittedAt,
          desc: `Feedback: "${c.feedback_text || c.feedbackText}"`,
        });
      }

      const endorsedByList = c.endorsed_by || c.endorsedBy || [];
      if (Array.isArray(endorsedByList)) {
        endorsedByList.forEach((e) => {
          const name = typeof e === 'object' ? e.employeeName : e;
          const id = typeof e === 'object' ? e.employeeId : e;
          events.push({
            title: '👍 Endorsement Added',
            time: e.endorsedAt || c.created_at || c.createdAt,
            desc: `Endorsed by: ${name || id}`,
          });
        });
      }
    });

    events.sort((a, b) => new Date(a.time) - new Date(b.time));

    return (
      <View style={styles.historyBox}>
        <Text style={styles.historyBoxTitle}>Workflow Timeline:</Text>
        <View style={styles.timeline}>
          {events.map((ev, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineEventTitle}>{ev.title}</Text>
                  <Text style={styles.timelineTime}>{formatRelativeTime(ev.time)}</Text>
                </View>
                <Text style={styles.timelineDesc}>{ev.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setIsExpanded(!isExpanded)} style={styles.cardHeader}>
        <View style={styles.groupBadge}>
          <Text style={styles.groupBadgeText}>📦 MERGED GROUP #{group.id.slice(0, 8)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={group.status || 'merged_public'} />
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.managerDesc}>{group.manager_description || group.managerDescription}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📍 Room: <Text style={styles.metaVal}>{group.room_id || group.roomId}</Text></Text>
        <Text style={styles.metaText}>🏷️ Category: <Text style={styles.metaVal}>{group.category}</Text></Text>
        <Text style={styles.metaText}>👥 Merged Issues: <Text style={styles.metaVal}>{constituentIds.length} tickets</Text></Text>
      </View>

      {group.escalation_note ? (
        <View style={styles.escalationBox}>
          <Text style={styles.escalationTitle}>🚨 Escalation Note:</Text>
          <Text style={styles.escalationText}>{group.escalation_note}</Text>
        </View>
      ) : null}

      {/* Endorsement list details */}
      {endorsedBy.length > 0 ? (
        <View style={styles.endorsementBox}>
          <Text style={styles.endorsementTitle}>👥 Endorsements & Timestamps:</Text>
          <View style={styles.endorsementContainer}>
            {endorsedBy.map((e, index) => {
              const name = typeof e === 'object' ? e.employeeName : e;
              const id = typeof e === 'object' ? e.employeeId : e;
              const timeStr = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
              return (
                <View key={index} style={styles.endorsementPill}>
                  <Text style={styles.endorsementText}>{name || id}{timeStr}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {isExpanded && (
        <View style={styles.constituentsContainer}>
          <Text style={styles.constituentsTitle}>Constituent Tickets:</Text>
          {groupItems.map((cItem) => {
            const complThread = threads.find(tc => tc.some(c => c.id === cItem.id)) || [cItem];
            return (
              <View key={cItem.id} style={styles.cItemBox}>
                <Text style={styles.cItemTitle}>Raised by: {cItem.employee_name || cItem.employeeId}</Text>
                {renderWorkflowHistory(complThread)}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.dateText}>
          📅 {group.created_at || group.createdAt ? new Date(group.created_at || group.createdAt).toLocaleDateString() : 'Recent'}
        </Text>

        <View style={styles.actions}>
          {onEndorse && (
            <TouchableOpacity
              style={[styles.endorseBtn, isEndorsed && styles.endorseBtnActive, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleSinglePress(onEndorse, group.id)}
              disabled={isProcessing}
            >
              <Text style={[styles.endorseText, isEndorsed && styles.endorseTextActive]}>
                👍 {endorsedBy.length} {isEndorsed ? 'Endorsed' : 'Endorse'}
              </Text>
            </TouchableOpacity>
          )}

          {onAcknowledge && group.status !== 'acknowledged' && group.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.ackBtn, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleSinglePress(onAcknowledge, group.id)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Acknowledge</Text>
            </TouchableOpacity>
          )}

          {onComplete && group.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.completeBtn, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleSinglePress(onComplete, group)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Complete Group</Text>
            </TouchableOpacity>
          )}

          {onEscalate && group.status !== 'escalated' && group.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.escalateBtn, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleSinglePress(onEscalate, group)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Escalate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  groupBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '850',
  },
  expandIcon: {
    color: '#818CF8',
    fontSize: 12,
    marginLeft: 6,
  },
  managerDesc: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  metaVal: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  escalationBox: {
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderColor: '#D946EF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  escalationTitle: {
    color: '#F0ABFC',
    fontSize: 11,
    fontWeight: '700',
  },
  escalationText: {
    color: '#F8FAFC',
    fontSize: 12,
    marginTop: 2,
  },
  endorsementBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  endorsementTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  endorsementContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  endorsementPill: {
    backgroundColor: '#1E293B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  endorsementText: {
    color: '#E2E8F0',
    fontSize: 10,
  },
  constituentsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    marginBottom: 10,
  },
  constituentsTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  cItemBox: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cItemTitle: { color: '#E2E8F0', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  historyBox: {
    marginTop: 6,
  },
  historyBoxTitle: { color: '#94A3B8', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  timeline: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    marginLeft: 4,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 10,
  },
  timelineDot: {
    position: 'absolute',
    left: -12,
    top: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  timelineContent: {
    paddingLeft: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineEventTitle: { color: '#F8FAFC', fontSize: 10, fontWeight: '750' },
  timelineTime: { color: '#64748B', fontSize: 8 },
  timelineDesc: { color: '#94A3B8', fontSize: 10, marginTop: 1 },
  footer: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#312E81',
  },
  dateText: {
    color: '#818CF8',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  endorseBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#6366F1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endorseBtnActive: {
    backgroundColor: '#4338CA',
  },
  endorseText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
  },
  endorseTextActive: {
    color: '#FFFFFF',
  },
  ackBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  escalateBtn: {
    backgroundColor: '#C026D3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
