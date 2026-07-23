import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';

export const AuthorityOverviewScreen = ({ navigation }) => {
  const {
    complaints,
    mergedGroups,
    rooms,
    employees,
    managers,
    refreshAll,
    loading,
  } = useComplaints();
  const { logout } = useAuth();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const escalatedCount = complaints.filter((c) => c.status?.toLowerCase() === 'escalated').length;
  const escalatedGroupCount = mergedGroups.filter((g) => g.status?.toLowerCase() === 'escalated').length;
  const totalAccounts = employees.length + managers.length;

  return (
    <View style={styles.flex}>
      <CustomHeader title="Authority Portal" subtitle="Executive oversight & campus governance" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} tintColor="#6366F1" />}
      >
        <Text style={styles.sectionHeader}>EXECUTIVE FACILITY AUDIT</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#EF4444' }]} onPress={() => navigation.navigate('AuthorityEscalated')}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{escalatedCount + escalatedGroupCount}</Text>
            <Text style={styles.statLabel}>Escalated Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#6366F1' }]} onPress={() => navigation.navigate('AuthorityAll')}>
            <Text style={[styles.statValue, { color: '#818CF8' }]}>{complaints.length}</Text>
            <Text style={styles.statLabel}>Total Complaints</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#10B981' }]} onPress={() => navigation.navigate('AuthorityRooms')}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{rooms.length}</Text>
            <Text style={styles.statLabel}>Facility Rooms</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#F59E0B' }]} onPress={() => navigation.navigate('AuthorityUsers')}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{totalAccounts}</Text>
            <Text style={styles.statLabel}>Total Accounts</Text>
          </TouchableOpacity>
        </View>

        {/* System Health Overview Card */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>⚖️ Executive Governance Summary</Text>
          <Text style={styles.noticeSub}>
            You hold master administrative governance over the facility system. You can review auto-escalated issues (triggered by 5 rejections, 10 public endorsements, or 5 re-complaints), allocate room directories, and manage organization user accounts.
          </Text>

          <View style={styles.divider} />

          <View style={styles.kpiList}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Merged Master Groups:</Text>
              <Text style={styles.kpiVal}>{mergedGroups.length} groups</Text>
            </View>

            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Manager Accounts:</Text>
              <Text style={styles.kpiVal}>{managers.length} active</Text>
            </View>

            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Employee Accounts:</Text>
              <Text style={styles.kpiVal}>{employees.length} active</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 18, paddingBottom: 40 },
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
  noticeBox: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 20,
  },
  noticeTitle: { color: '#A5B4FC', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  noticeSub: { color: '#CBD5E1', fontSize: 13, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#312E81', marginVertical: 14 },
  kpiList: { gap: 8 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kpiLabel: { color: '#94A3B8', fontSize: 13 },
  kpiVal: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
