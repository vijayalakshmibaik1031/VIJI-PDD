import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { ComplaintCard } from '../../components/ComplaintCard';
import { MergedGroupCard } from '../../components/MergedGroupCard';
import { useComplaints } from '../../context/ComplaintContext';

export const AuthorityAllScreen = () => {
  const { complaints, mergedGroups, fetchComplaints, fetchMergedGroups, loading } = useComplaints();
  const [filter, setFilter] = useState('all');
  const [viewType, setViewType] = useState('tickets');

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'all') return true;
    return c.status?.toLowerCase() === filter;
  });

  const filteredGroups = mergedGroups.filter((g) => {
    if (filter === 'all') return true;
    return g.status?.toLowerCase() === filter;
  });

  return (
    <View style={styles.flex}>
      <CustomHeader title="Facility Audit Logs" subtitle="Full inspection log of all tickets and merged issues" />

      {/* View Type Toggle */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, viewType === 'tickets' && styles.typeBtnActive]}
          onPress={() => setViewType('tickets')}
        >
          <Text style={[styles.typeText, viewType === 'tickets' && styles.typeTextActive]}>
            All Tickets ({complaints.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, viewType === 'groups' && styles.typeBtnActive]}
          onPress={() => setViewType('groups')}
        >
          <Text style={[styles.typeText, viewType === 'groups' && styles.typeTextActive]}>
            Merged Groups ({mergedGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {['all', 'pending', 'in-progress', 'escalated', 'completed', 'rejected'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {viewType === 'tickets' ? (
          <FlatList
            data={filteredComplaints}
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
                <Text style={styles.emptyTitle}>No Complaints Found</Text>
                <Text style={styles.emptySub}>No tickets match the selected status filter.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredGroups}
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
                <Text style={styles.emptyTitle}>No Merged Groups Found</Text>
                <Text style={styles.emptySub}>No merged groups match the selected status filter.</Text>
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
  typeRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 6,
  },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: '#4F46E5' },
  typeText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  typeTextActive: { color: '#FFFFFF' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 6,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 4, backgroundColor: '#0F172A' },
  tabActive: { backgroundColor: '#4338CA' },
  tabText: { color: '#94A3B8', fontSize: 9, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#94A3B8', fontSize: 14, marginTop: 6 },
});
