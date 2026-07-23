import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { MergedGroupCard } from '../../components/MergedGroupCard';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerCompletedScreen = () => {
  const { complaints, mergedGroups, fetchComplaints, fetchMergedGroups, loading } = useComplaints();
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const completedTickets = complaints.filter(
    (c) => c.status?.toLowerCase() === 'completed' || c.status?.toLowerCase() === 'resolved'
  );

  const completedMergedGroups = mergedGroups.filter(
    (g) => g.status?.toLowerCase() === 'completed'
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Completed Tickets & Groups" subtitle="Resolved maintenance log and photo proofs" />
      
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'tickets' && styles.tabBtnTextActive]}>
            Tickets ({completedTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'groups' && styles.tabBtnActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'groups' && styles.tabBtnTextActive]}>
            Merged Groups ({completedMergedGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'tickets' ? (
          <FlatList
            data={completedTickets}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ComplaintCard complaint={item} />}
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
                <Text style={styles.emptyTitle}>No Completed Tickets</Text>
                <Text style={styles.emptySub}>No individual tickets marked completed yet.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={completedMergedGroups}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MergedGroupCard group={item} />}
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
                <Text style={styles.emptyTitle}>No Completed Groups</Text>
                <Text style={styles.emptySub}>No merged master groups marked completed yet.</Text>
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
    backgroundColor: '#10B981',
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
});
