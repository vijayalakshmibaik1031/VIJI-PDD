import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';

export const ManagerOverviewScreen = () => {
  const { complaints, fetchComplaints, loading } = useComplaints();

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const pendingCount = complaints.filter(c => c.status?.toLowerCase() === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status?.toLowerCase() === 'in-progress' || c.status?.toLowerCase() === 'in_progress').length;
  const completedCount = complaints.filter(c => c.status?.toLowerCase() === 'completed' || c.status?.toLowerCase() === 'resolved').length;
  const escalatedCount = complaints.filter(c => c.status?.toLowerCase() === 'escalated').length;

  return (
    <View style={styles.flex}>
      <CustomHeader title="Manager Portal" subtitle="Facility complaints status overview" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#6366F1" />}
      >
        <Text style={styles.sectionHeader}>DASHBOARD METRICS</Text>
        <View style={styles.grid}>
          <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#0EA5E9' }]}>
            <Text style={[styles.statValue, { color: '#0EA5E9' }]}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#10B981' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#EF4444' }]}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{escalatedCount}</Text>
            <Text style={styles.statLabel}>Escalated</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Facility System Status</Text>
          <Text style={styles.summaryText}>
            Total tickets in system: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{complaints.length}</Text>
          </Text>
          <Text style={styles.summarySub}>Pull down to refresh live database metrics.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 18 },
  sectionHeader: { color: '#6366F1', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  summaryText: { color: '#CBD5E1', fontSize: 14 },
  summarySub: { color: '#64748B', fontSize: 12, marginTop: 8 },
});
