import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { MergedGroupCard } from '../../components/MergedGroupCard';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';

export const EmployeePublicScreen = () => {
  const { complaints, mergedGroups, fetchComplaints, fetchMergedGroups, endorseComplaint, endorseMergedGroup, loading } = useComplaints();
  const { user } = useAuth();
  const [feedType, setFeedType] = useState('ongoing'); // ongoing or completed
  const [activeTab, setActiveTab] = useState('tickets'); // tickets or groups

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const currentEmpId = user?.id || user?.userId || 'emp001';

  // Ongoing Merged
  const mergedOngoing = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds || group.constituent_complaint_ids) &&
      (group.status === 'merged_public' || group.status === 'escalated')
  );

  // Completed Merged
  const mergedCompleted = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds || group.constituent_complaint_ids) &&
      group.status === 'completed'
  );

  // Ongoing public tickets
  const individualOngoing = complaints.filter(
    (c) =>
      c.visibility === 'public' &&
      !c.parentComplaintId &&
      !c.parent_complaint_id &&
      !c.mergedIntoId &&
      !c.merged_into_id &&
      c.status !== 'completed' &&
      c.status !== 'rejected'
  );

  // Completed public tickets
  const individualCompleted = complaints.filter(
    (c) =>
      c.visibility === 'public' &&
      !c.parentComplaintId &&
      !c.parent_complaint_id &&
      !c.mergedIntoId &&
      !c.merged_into_id &&
      c.status === 'completed'
  );

  const mergedVisible = feedType === 'ongoing' ? mergedOngoing : mergedCompleted;
  const individualPublicVisible = feedType === 'ongoing' ? individualOngoing : individualCompleted;

  const handleEndorseComplaint = async (complaintId) => {
    try {
      await endorseComplaint(complaintId, currentEmpId);
      Alert.alert('Endorsed', 'Thank you for endorsing this public issue.');
    } catch (err) {
      Alert.alert('Endorsement', err.message || 'Already endorsed');
    }
  };

  const handleEndorseMergedGroup = async (groupId) => {
    try {
      await endorseMergedGroup(groupId, currentEmpId);
      Alert.alert('Endorsed', 'Thank you for endorsing this merged facility issue.');
    } catch (err) {
      Alert.alert('Endorsement', err.message || 'Already endorsed');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Community Public Feed" subtitle="Endorse & support open facility issues" />
      
      {/* Ongoing / Completed Feed Toggles */}
      <View style={styles.feedTypeContainer}>
        <TouchableOpacity
          style={[styles.feedTypeBtn, feedType === 'ongoing' && styles.feedTypeBtnActive]}
          onPress={() => setFeedType('ongoing')}
        >
          <Text style={[styles.feedTypeText, feedType === 'ongoing' && styles.feedTypeTextActive]}>
            Ongoing Feed ({mergedOngoing.length + individualOngoing.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedTypeBtn, feedType === 'completed' && styles.feedTypeBtnActive]}
          onPress={() => setFeedType('completed')}
        >
          <Text style={[styles.feedTypeText, feedType === 'completed' && styles.feedTypeTextActive]}>
            Completed Feed ({mergedCompleted.length + individualCompleted.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'tickets' && styles.tabBtnTextActive]}>
            Public Tickets ({individualPublicVisible.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'groups' && styles.tabBtnActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'groups' && styles.tabBtnTextActive]}>
            Merged Groups ({mergedVisible.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'tickets' ? (
          <FlatList
            data={individualPublicVisible}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                currentUserId={currentEmpId}
                onEndorse={feedType === 'ongoing' ? handleEndorseComplaint : null}
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
                <Text style={styles.emptyTitle}>No Public Tickets</Text>
                <Text style={styles.emptySub}>No individual facility issues in this feed section.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={mergedVisible}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <MergedGroupCard
                group={item}
                currentUserId={currentEmpId}
                onEndorse={feedType === 'ongoing' ? handleEndorseMergedGroup : null}
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
                <Text style={styles.emptyTitle}>No Merged Groups</Text>
                <Text style={styles.emptySub}>No community merged groups in this feed section.</Text>
              </View>
            }
          />
        )}
      </View>
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
    backgroundColor: '#4F46E5',
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
  feedTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  feedTypeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  feedTypeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  feedTypeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  feedTypeTextActive: {
    color: '#FFFFFF',
  },
});
