import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBadge } from './StatusBadge';

export const MergedGroupCard = ({
  group,
  onEndorse,
  onAcknowledge,
  onComplete,
  onEscalate,
  currentUserId,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

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
    : (group.constituent_complaint_ids || []);

  const endorsedBy = Array.isArray(group.endorsed_by) ? group.endorsed_by : [];
  const isEndorsed = currentUserId && endorsedBy.includes(currentUserId);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.groupBadge}>
          <Text style={styles.groupBadgeText}>📦 MERGED GROUP #{group.id.slice(0, 8)}</Text>
        </View>
        <StatusBadge status={group.status || 'merged_public'} />
      </View>

      <Text style={styles.managerDesc}>{group.manager_description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📍 Room: <Text style={styles.metaVal}>{group.room_id}</Text></Text>
        <Text style={styles.metaText}>🏷️ Category: <Text style={styles.metaVal}>{group.category}</Text></Text>
        <Text style={styles.metaText}>👥 Merged Issues: <Text style={styles.metaVal}>{constituentIds.length} tickets</Text></Text>
      </View>

      {group.escalation_note ? (
        <View style={styles.escalationBox}>
          <Text style={styles.escalationTitle}>🚨 Escalation Note:</Text>
          <Text style={styles.escalationText}>{group.escalation_note}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.dateText}>
          📅 {group.created_at ? new Date(group.created_at).toLocaleDateString() : 'Recent'}
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
    borderRadius: 6,
  },
  groupBadgeText: {
    color: '#EEF2FF',
    fontSize: 11,
    fontWeight: '800',
  },
  managerDesc: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 4,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 12,
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
