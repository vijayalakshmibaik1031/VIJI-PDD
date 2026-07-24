import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { MergedGroupCard } from '../../components/MergedGroupCard';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerCompletedScreen = () => {
  const { complaints, mergedGroups, fetchComplaints, fetchMergedGroups, loading } = useComplaints();
  const [activeTab, setActiveTab] = useState('private'); // private, public, merged

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const privateDone = complaints.filter(
    (c) => (c.status?.toLowerCase() === 'completed' || c.status?.toLowerCase() === 'resolved') && c.visibility === 'private'
  );

  const publicDone = complaints.filter(
    (c) => (c.status?.toLowerCase() === 'completed' || c.status?.toLowerCase() === 'resolved') && c.visibility === 'public'
  );

  const mergedDone = mergedGroups.filter(
    (g) => g.status?.toLowerCase() === 'completed'
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Completed Tickets & Groups" subtitle="Resolved maintenance log and photo proofs" />
      
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'private' && styles.tabBtnActive]}
          onPress={() => setActiveTab('private')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'private' && styles.tabBtnTextActive]}>
            Private ({privateDone.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'public' && styles.tabBtnActive]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'public' && styles.tabBtnTextActive]}>
            Public ({publicDone.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'merged' && styles.tabBtnActive]}
          onPress={() => setActiveTab('merged')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'merged' && styles.tabBtnTextActive]}>
            Merged ({mergedDone.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'private' && (
          <FlatList
            data={privateDone}
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
                <Text style={styles.emptyTitle}>No Completed Private Tickets</Text>
                <Text style={styles.emptySub}>No private tickets completed yet.</Text>
              </View>
            }
          />
        )}

        {activeTab === 'public' && (
          <FlatList
            data={publicDone}
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
                <Text style={styles.emptyTitle}>No Completed Public Tickets</Text>
                <Text style={styles.emptySub}>No public tickets completed yet.</Text>
              </View>
            }
          />
        )}

        {activeTab === 'merged' && (
          <FlatList
            data={mergedDone}
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
                <Text style={styles.emptyTitle}>No Completed Merged Groups</Text>
                <Text style={styles.emptySub}>No merged groups completed yet.</Text>
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
    fontSize: 11,
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
