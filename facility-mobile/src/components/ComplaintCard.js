import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { StatusBadge } from './StatusBadge';

export function formatRelativeTime(isoString) {
  if (!isoString) return 'Recent';
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

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

export const ComplaintCard = ({
  complaint,
  onApprove,
  onComplete,
  onReject,
  onEscalate,
  onRaiseToPublic,
  onEndorse,
  onRecomplain,
  hasRecomplained,
  isPublic,
  onSelectToggle,
  isSelected,
  currentUserId,
  showSelectBox,
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

  const endorsedList = Array.isArray(complaint.endorsed_by)
    ? complaint.endorsed_by
    : Array.isArray(complaint.endorsedBy)
    ? complaint.endorsedBy
    : [];
  const isEndorsed = currentUserId && endorsedList.some(e => {
    if (typeof e === 'object' && e !== null) return String(e.employeeId) === String(currentUserId);
    return String(e) === String(currentUserId);
  });
  const endorsementCount = endorsedList.length || (complaint.upvotes || 0);

  return (
    <TouchableOpacity
      activeOpacity={showSelectBox ? 0.8 : 1}
      onPress={() => showSelectBox && onSelectToggle && onSelectToggle(complaint.id)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          {showSelectBox && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{complaint.category || 'General'}</Text>
          </View>
          {complaint.visibility === 'public' && (
            <View style={styles.publicPill}>
              <Text style={styles.publicText}>🌐 PUBLIC</Text>
            </View>
          )}
        </View>
        <StatusBadge status={complaint.status} />
      </View>

      <Text style={styles.ticketId}>ID: #{complaint.id}</Text>
      <Text style={styles.description}>{complaint.description}</Text>

      <View style={styles.metaGrid}>
        <Text style={styles.metaText}>📍 Room: <Text style={styles.metaVal}>{complaint.room_id || complaint.roomNo || 'N/A'}</Text></Text>
        <Text style={styles.metaText}>🏢 Floor: <Text style={styles.metaVal}>{formatFloorName(complaint.floor_number)}</Text></Text>
        <Text style={styles.metaText}>👤 Raised by: <Text style={styles.metaVal}>{complaint.employee_name || complaint.employeeId || 'Employee'}</Text></Text>
        <Text style={styles.metaText}>👔 Manager: <Text style={styles.metaVal}>{complaint.floor_manager_name || 'N/A'}</Text></Text>
      </View>

      {/* Rejection Details */}
      {complaint.status === 'rejected' && (complaint.rejection_reason || complaint.rejectionReason) ? (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionTitle}>❌ Rejection Reason:</Text>
          <Text style={styles.rejectionText}>
            {complaint.rejection_reason || complaint.rejectionReason} {complaint.rejected_at || complaint.rejectedAt ? `(${formatRelativeTime(complaint.rejected_at || complaint.rejectedAt)})` : ''}
          </Text>
        </View>
      ) : null}

      {/* Completion / Resolution Details */}
      {(complaint.status === 'completed' || complaint.status === 'resolved') && (
        <View style={styles.completionBox}>
          <Text style={styles.completionTitle}>✅ Resolved / Completion Notes:</Text>
          <Text style={styles.completionText}>
            {complaint.completion_description || complaint.completionDescription || complaint.resolutionNotes || 'Issue resolved successfully.'} {complaint.completed_at || complaint.completedAt ? `(${formatRelativeTime(complaint.completed_at || complaint.completedAt)})` : ''}
          </Text>
          {complaint.completion_photo_uri || complaint.completionPhotoUri ? (
            <View style={styles.photoContainer}>
              <Text style={styles.photoUriText}>📷 Photo Proof: {complaint.completion_photo_uri || complaint.completionPhotoUri}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Escalation details */}
      {complaint.status === 'escalated' && (
        <View style={styles.escalatedBox}>
          <Text style={styles.escalatedTitle}>🚨 Escalated to Authority:</Text>
          <Text style={styles.escalatedText}>
            {complaint.escalation_description || complaint.escalationDescription || 'Escalated to authority for review.'} {complaint.escalated_at || complaint.escalatedAt ? `(${formatRelativeTime(complaint.escalated_at || complaint.escalatedAt)})` : ''}
          </Text>
        </View>
      )}

      {/* Feedback details */}
      {(complaint.feedbackText || complaint.feedback_text) ? (
        <View style={styles.feedbackShowBox}>
          <Text style={styles.feedbackShowTitle}>💬 Employee Feedback:</Text>
          <Text style={styles.feedbackShowText}>
            {complaint.feedbackText || complaint.feedback_text} {complaint.feedbackSubmittedAt || complaint.feedback_submitted_at ? `(${formatRelativeTime(complaint.feedbackSubmittedAt || complaint.feedback_submitted_at)})` : ''}
          </Text>
        </View>
      ) : null}

      {/* Raised to public timestamp */}
      {complaint.visibility === 'public' && (complaint.raisedToPublicAt || complaint.raised_to_public_at) ? (
        <View style={styles.raisedPublicBox}>
          <Text style={styles.raisedPublicText}>
            📢 Publicly Visible since: {formatRelativeTime(complaint.raisedToPublicAt || complaint.raised_to_public_at)}
          </Text>
        </View>
      ) : null}

      {/* Endorsement list details */}
      {Array.isArray(complaint.endorsed_by) && complaint.endorsed_by.length > 0 ? (
        <View style={styles.endorsementBox}>
          <Text style={styles.endorsementTitle}>👥 Endorsements & Timestamps:</Text>
          <View style={styles.endorsementContainer}>
            {complaint.endorsed_by.map((e, index) => {
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

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          📅 {complaint.created_at || complaint.createdAt ? formatRelativeTime(complaint.created_at || complaint.createdAt) : 'Recent'}
        </Text>

        <View style={styles.actionRow}>
          {/* Endorse Button */}
          {onEndorse && (
            <TouchableOpacity
              style={[styles.endorseBtn, isEndorsed && styles.endorseBtnActive, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onEndorse, complaint.id)}
              disabled={isProcessing}
            >
              <Text style={[styles.endorseText, isEndorsed && styles.endorseTextActive]}>
                👍 {endorsementCount} {isEndorsed ? 'Endorsed' : 'Endorse'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Recomplain Button */}
          {hasRecomplained ? (
            <View style={styles.recomplainedDisabledBtn}>
              <Text style={styles.recomplainedDisabledText}>Re-Complained ✓ — awaiting manager review</Text>
            </View>
          ) : onRecomplain && complaint.status === 'rejected' ? (
            <TouchableOpacity
              style={[styles.recomplainBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onRecomplain, complaint)}
              disabled={isProcessing}
            >
              <Text style={styles.recomplainText}>🔄 Re-Complain</Text>
            </TouchableOpacity>
          ) : null}

          {/* Approve Button */}
          {onApprove && (
            <TouchableOpacity
              style={[styles.approveBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onApprove, complaint)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>{isProcessing ? 'Processing...' : 'Approve'}</Text>
            </TouchableOpacity>
          )}

          {/* Raise to Public Button */}
          {onRaiseToPublic && complaint.visibility !== 'public' && (
            <TouchableOpacity
              style={[styles.publicBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onRaiseToPublic, complaint.id)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Make Public</Text>
            </TouchableOpacity>
          )}

          {/* Public Issue Badge */}
          {isPublic && (
            <View style={styles.publicBadgeBox}>
              <Text style={styles.publicBadgeText}>Public issue open for endorsements</Text>
            </View>
          )}

          {/* Complete Button */}
          {onComplete && (
            <TouchableOpacity
              style={[styles.completeBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onComplete, complaint)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Complete</Text>
            </TouchableOpacity>
          )}

          {/* Reject Button */}
          {onReject && (
            <TouchableOpacity
              style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onReject, complaint)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          )}

          {/* Escalate Button */}
          {onEscalate && (
            <TouchableOpacity
              style={[styles.escalateBtn, isProcessing && styles.btnDisabled]}
              onPress={() => handleSinglePress(onEscalate, complaint)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>Escalate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#1E1B4B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryPill: {
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  publicPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  publicText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketId: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaGrid: {
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
    fontWeight: '600',
  },
  rejectionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  rejectionTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectionText: {
    color: '#F8FAFC',
    fontSize: 12,
    marginTop: 2,
  },
  completionBox: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  completionTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  photoContainer: {
    marginTop: 6,
  },
  photoUriText: {
    color: '#93C5FD',
    fontSize: 11,
    fontStyle: 'italic',
  },
  escalatedBox: {
    backgroundColor: '#4C1D95',
    borderColor: '#C026D3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  escalatedTitle: {
    color: '#F472B6',
    fontSize: 12,
    fontWeight: '800',
  },
  escalatedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  dateText: {
    color: '#64748B',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  endorseBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endorseBtnActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  endorseText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  endorseTextActive: {
    color: '#FFFFFF',
  },
  recomplainBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recomplainText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recomplainedDisabledBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recomplainedDisabledText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  publicBadgeBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publicBadgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  approveBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publicBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
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
    fontWeight: '600',
  },
  feedbackShowBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  feedbackShowTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedbackShowText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  raisedPublicBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  raisedPublicText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  endorsementBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
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
});
