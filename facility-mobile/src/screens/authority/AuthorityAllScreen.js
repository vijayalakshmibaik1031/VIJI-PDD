import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatRelativeTime } from '../../components/ComplaintCard';

export const AuthorityAllScreen = () => {
  const { complaints, mergedGroups, fetchComplaints, fetchMergedGroups, loading } = useComplaints();
  const [activeTab, setActiveTab] = useState('pending'); // pending, ongoing, completed
  const [subCategory, setSubCategory] = useState('private'); // private, public, merged

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchComplaints();
    fetchMergedGroups();
  }, [fetchComplaints, fetchMergedGroups]);

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'escalated': return '#A855F7';
      case 'in-progress': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  // Build threads out of complaints
  const threads = useMemo(() => {
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

    return Object.values(threadsMap).sort((a, b) => {
      const aLast = new Date(a[a.length - 1].created_at || a[a.length - 1].createdAt);
      const bLast = new Date(b[b.length - 1].created_at || b[b.length - 1].createdAt);
      return bLast - aLast;
    });
  }, [complaints]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((tc) => {
      const root = tc[0];
      const latest = tc[tc.length - 1];

      const itemDate = new Date(root.created_at || root.createdAt);
      const y = itemDate.getFullYear().toString();
      const m = (itemDate.getMonth() + 1).toString();
      const d = itemDate.getDate().toString();

      if (roomFilter && !root.room_id?.toLowerCase().includes(roomFilter.toLowerCase()) && !root.roomId?.toLowerCase().includes(roomFilter.toLowerCase())) return false;
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== parseInt(filterMonth, 10).toString()) return false;
      if (filterDay && d !== parseInt(filterDay, 10).toString()) return false;

      const isCompleted = tc.some(c => c.status === 'completed');
      const escalatedComplaint = tc.find(c => c.status === 'escalated');
      const isEscalated = !!escalatedComplaint;
      const latestStatus = latest.status;

      if (activeTab === 'pending') {
        if (latestStatus !== 'pending') return false;
      } else if (activeTab === 'ongoing') {
        if (isCompleted || (latestStatus !== 'in-progress' && !isEscalated && latestStatus !== 'rejected' && latestStatus !== 'recomplained')) return false;
      } else if (activeTab === 'completed') {
        if (!isCompleted) return false;
      }

      if (subCategory === 'private') {
        if (latest.visibility !== 'private') return false;
      } else if (subCategory === 'public') {
        if (latest.visibility !== 'public') return false;
      } else {
        return false;
      }

      return true;
    });
  }, [threads, activeTab, subCategory, roomFilter, filterYear, filterMonth, filterDay]);

  // Filter merged groups
  const filteredMerged = useMemo(() => {
    if (subCategory !== 'merged') return [];
    return mergedGroups.filter((group) => {
      const itemDate = new Date(group.created_at || group.createdAt);
      const y = itemDate.getFullYear().toString();
      const m = (itemDate.getMonth() + 1).toString();
      const d = itemDate.getDate().toString();

      if (roomFilter && !group.room_id?.toLowerCase().includes(roomFilter.toLowerCase()) && !group.roomId?.toLowerCase().includes(roomFilter.toLowerCase())) return false;
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== parseInt(filterMonth, 10).toString()) return false;
      if (filterDay && d !== parseInt(filterDay, 10).toString()) return false;

      if (activeTab === 'pending') {
        return false;
      } else if (activeTab === 'ongoing') {
        return group.status === 'merged_public' || group.status === 'escalated' || group.status === 'acknowledged';
      } else if (activeTab === 'completed') {
        return group.status === 'completed';
      }

      return true;
    });
  }, [mergedGroups, activeTab, subCategory, roomFilter, filterYear, filterMonth, filterDay]);

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

      const endorsedBy = c.endorsed_by || [];
      if (Array.isArray(endorsedBy)) {
        endorsedBy.forEach((e) => {
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

  const isEmpty = subCategory === 'merged' ? !filteredMerged.length : !filteredThreads.length;

  return (
    <View style={styles.flex}>
      <CustomHeader title="Facility Audit Logs" subtitle="Full inspection log of all tickets and merged issues" />

      {/* Main Tabs (Pending / Ongoing / Completed) */}
      <View style={styles.typeRow}>
        {['pending', 'ongoing', 'completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.typeBtn, activeTab === tab && styles.typeBtnActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'pending' && subCategory === 'merged') {
                setSubCategory('private');
              }
            }}
          >
            <Text style={[styles.typeText, activeTab === tab && styles.typeTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub Toggles (Private / Public / Merged) */}
      <View style={styles.tabBar}>
        {['private', 'public', 'merged'].map((sub) => {
          if (activeTab === 'pending' && sub === 'merged') return null;
          return (
            <TouchableOpacity
              key={sub}
              style={[styles.tab, subCategory === sub && styles.tabActive]}
              onPress={() => setSubCategory(sub)}
            >
              <Text style={[styles.tabText, subCategory === sub && styles.tabTextActive]}>
                {sub.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filters (Room & Date) */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.roomInput}
          placeholder="Filter by room..."
          placeholderTextColor="#64748B"
          value={roomFilter}
          onChangeText={setRoomFilter}
        />
      </View>

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
        {isEmpty ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptySub}>No issues match the selected parameters.</Text>
          </View>
        ) : subCategory === 'merged' ? (
          <FlatList
            data={filteredMerged}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item: group }) => {
              const isExpanded = !!expandedItems[group.id];
              const groupItems = complaints.filter((c) => group.constituentComplaintIds?.includes(c.id) || group.constituent_complaint_ids?.includes(c.id));
              return (
                <View style={styles.card}>
                  <TouchableOpacity onPress={() => toggleExpand(group.id)} style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardRoom}>Room {group.room_id || group.roomId}</Text>
                      <Text style={styles.cardCategory}>{group.category}</Text>
                    </View>
                    <Text style={styles.expandText}>{isExpanded ? '▲ Hide' : '▼ Expand'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.descText}>{group.manager_description || group.managerDescription}</Text>
                  
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
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={() => { fetchComplaints(); fetchMergedGroups(); }} tintColor="#6366F1" />
            }
          />
        ) : (
          <FlatList
            data={filteredThreads}
            keyExtractor={(item) => String(item[0].id)}
            renderItem={({ item: tc }) => {
              const root = tc[0];
              const latest = tc[tc.length - 1];
              const key = root.id;
              const isExpanded = !!expandedItems[key];
              const displayStatus = tc.find(c => c.status === 'escalated') ? 'escalated' : latest.status;

              return (
                <View style={[styles.card, displayStatus === 'escalated' && styles.escalatedCard]}>
                  <TouchableOpacity onPress={() => toggleExpand(key)} style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardRoom}>Room {root.room_id || root.roomId}</Text>
                      <Text style={styles.cardCategory}>{root.category}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) }]}>
                        {displayStatus.toUpperCase()}
                      </Text>
                      <Text style={styles.expandText}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.descText}>{latest.description}</Text>
                  <Text style={styles.raisedByText}>Raised by: {root.employee_name || root.employeeId}</Text>

                  {isExpanded && renderWorkflowHistory(tc)}
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={() => { fetchComplaints(); fetchMergedGroups(); }} tintColor="#6366F1" />
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
  typeText: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
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
  tabText: { color: '#94A3B8', fontSize: 10, fontWeight: '750' },
  tabTextActive: { color: '#FFFFFF' },
  searchRow: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  roomInput: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 6,
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
  content: { flex: 1, padding: 16 },
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#94A3B8', fontSize: 14, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  escalatedCard: {
    borderColor: '#A855F7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardRoom: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  cardCategory: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  expandText: { color: '#64748B', fontSize: 12 },
  descText: { color: '#CBD5E1', fontSize: 13, lineHeight: 18 },
  raisedByText: { color: '#64748B', fontSize: 11, marginTop: 6 },
  historyBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  historyBoxTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  timeline: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    marginLeft: 6,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 12,
  },
  timelineDot: {
    position: 'absolute',
    left: -14,
    top: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  timelineContent: {
    paddingLeft: 6,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineEventTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: '750' },
  timelineTime: { color: '#64748B', fontSize: 9 },
  timelineDesc: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  constituentsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
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
});

// Context Injection Helper
import { useComplaints } from '../../context/ComplaintContext';
