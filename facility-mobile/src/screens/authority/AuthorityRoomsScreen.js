import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';

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

export const AuthorityRoomsScreen = () => {
  const { rooms, managers, fetchRooms, fetchManagers, createRoom, updateRoom, deleteRoom, createFloorManager, fetchFloorManagerHistory, updateFloorLimit, loading } = useComplaints();

  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [showAddFloorInput, setShowAddFloorInput] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [numRooms, setNumRooms] = useState('5');
  const [creatingFloorManager, setCreatingFloorManager] = useState(false);
  const [history, setHistory] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [editingFloor, setEditingFloor] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingLimitFloor, setEditingLimitFloor] = useState(null);
  const [newLimitValue, setNewLimitValue] = useState('');
  const [selectedRoomIdsToDelete, setSelectedRoomIdsToDelete] = useState([]);
  const [savingLimit, setSavingLimit] = useState(false);

  const loadHistory = async () => {
    if (fetchFloorManagerHistory) {
      const data = await fetchFloorManagerHistory();
      setHistory(data || []);
    }
  };

  const handleSaveFloorLimit = async () => {
    const val = parseInt(newLimitValue, 10);
    if (isNaN(val) || val < 1 || val > 20) {
      Alert.alert('Validation Error', 'New room limit must be between 1 and 20');
      return;
    }

    setSavingLimit(true);
    try {
      if (updateFloorLimit) {
        await updateFloorLimit(editingLimitFloor, val, selectedRoomIdsToDelete);
      }
      Alert.alert('Success', 'Floor room limit updated successfully.');
      setEditingLimitFloor(null);
      loadHistory();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update floor limit');
    } finally {
      setSavingLimit(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    if (fetchManagers) fetchManagers();
    loadHistory();
  }, [fetchRooms, fetchManagers]);

  // Compute unique floors list strictly from assigned floor managers
  const floorManagers = useMemo(() => {
    return (managers || []).filter(m => m.floor_number !== null && m.floor_number !== undefined && m.floor_number !== '');
  }, [managers]);

  const allFloors = useMemo(() => {
    const set = new Set(floorManagers.map(m => String(m.floor_number)));
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [floorManagers]);

  const nextFloorNum = useMemo(() => {
    const validFloors = allFloors.map(f => parseInt(f, 10)).filter(n => !isNaN(n));
    if (validFloors.length === 0) return 0;
    return Math.max(...validFloors) + 1;
  }, [allFloors]);

  useEffect(() => {
    if (allFloors.length > 0) {
      if (!allFloors.includes(selectedFloor)) {
        setSelectedFloor(allFloors[0]);
      }
    } else {
      setSelectedFloor('');
    }
  }, [allFloors]);

  const handleCreateFloorManager = async () => {
    if (!mgrName.trim() || !mgrEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter Manager Name and Email.');
      return;
    }
    if (!mgrEmail.trim().toLowerCase().endsWith('@xyzcompany.com')) {
      Alert.alert('Validation Error', 'Email must end with @xyzcompany.com');
      return;
    }
    const val = parseInt(numRooms, 10);
    if (isNaN(val) || val < 1 || val > 20) {
      Alert.alert('Validation Error', 'Number of rooms must be between 1 and 20');
      return;
    }

    setCreatingFloorManager(true);
    try {
      const res = await createFloorManager(mgrName.trim(), mgrEmail.trim().toLowerCase(), val);
      Alert.alert('Success', `Floor ${formatFloorName(res.floorNumber)} created with ${val} rooms! Assigned Manager ID: ${res.managerId}`);
      setSelectedFloor(String(res.floorNumber));
      setMgrName('');
      setMgrEmail('');
      setNumRooms('5');
      setShowAddFloorInput(false);
      loadHistory();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create floor manager');
    } finally {
      setCreatingFloorManager(false);
    }
  };

  const handleAddRoom = async () => {
    if (allFloors.length === 0 || !selectedFloor) {
      Alert.alert('Action Required', 'Please create a floor with a Floor Manager first!');
      return;
    }
    if (!newRoomNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a room number.');
      return;
    }

    const normalized = newRoomNumber.trim();
    const duplicate = rooms.some(
      (r) => String(r.room_number).toLowerCase() === normalized.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate Room', 'Room number already exists in system.');
      return;
    }

    // Find the floor manager's room limit
    const mgr = (managers || []).find(m => String(m.floor_number) === String(selectedFloor));
    if (mgr && mgr.room_limit > 0) {
      const currentRoomsOnFloor = rooms.filter(r => String(r.floor_number) === String(selectedFloor)).length;
      if (currentRoomsOnFloor >= mgr.room_limit) {
        Alert.alert('Limit Reached', `Cannot create room: Limit of ${mgr.room_limit} rooms reached for this floor.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createRoom(normalized, selectedFloor);
      Alert.alert('Success', `Room ${normalized} added to ${formatFloorName(selectedFloor)}.`);
      setNewRoomNumber('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editingNumber.trim()) return;
    const normalizedRoom = editingNumber.trim();
    const normalizedFloor = editingFloor.trim();

    const duplicate = rooms.some(
      (r) => r.id !== id && String(r.room_number).toLowerCase() === normalizedRoom.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate Room', 'Another room already has this room number.');
      return;
    }

    try {
      await updateRoom(id, normalizedRoom, normalizedFloor);
      Alert.alert('Updated', 'Room updated successfully');
      setEditingId(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update room');
    }
  };

  const handleDelete = (room) => {
    Alert.alert('Confirm Delete', `Delete Room ${room.room_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoom(room.id);
            Alert.alert('Deleted', 'Room removed.');
          } catch (err) {
            Alert.alert('Error', err.message || 'Deletion failed');
          }
        },
      },
    ]);
  };

  const filteredRooms = rooms.filter(
    (r) =>
      String(r.room_number).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.floor_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatFloorName(r.floor_number).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Manage Room & Floor Inventory" subtitle="Add floor managers to create floors in ascending order" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Floor Selection & Add Room Header Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏢 Manage Floors & Add Room</Text>

          <Text style={styles.label}>Select Floor</Text>
          <View style={styles.floorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {allFloors.length === 0 ? (
                <View style={styles.noFloorPill}>
                  <Text style={styles.noFloorText}>No Floors Created Yet</Text>
                </View>
              ) : (
                allFloors.map((f) => {
                  const mgr = floorManagers.find(m => String(m.floor_number) === String(f));
                  const isActive = selectedFloor === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.floorChip, isActive && styles.floorChipActive]}
                      onPress={() => setSelectedFloor(f)}
                    >
                      <Text style={[styles.floorChipText, isActive && styles.floorChipTextActive]}>
                        {formatFloorName(f)} {mgr ? `(${mgr.name})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity style={styles.plusBtn} onPress={() => setShowAddFloorInput(!showAddFloorInput)}>
              <Text style={styles.plusBtnText}>➕ Add Floor</Text>
            </TouchableOpacity>
          </View>

          {allFloors.length === 0 && !showAddFloorInput && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ No floors created yet. Tap "+ Add Floor" above to create Ground Floor and assign its Floor Manager first!
              </Text>
            </View>
          )}

          {showAddFloorInput && (
            <View style={styles.addFloorBox}>
              <Text style={styles.addFloorTitle}>
                Create Next Floor: <Text style={styles.highlightText}>{formatFloorName(nextFloorNum)}</Text>
              </Text>
              <Text style={styles.subLabel}>Assign a dedicated Floor Manager for Floor {nextFloorNum}</Text>

              <TextInput
                style={styles.input}
                placeholder="Floor Manager Name *"
                placeholderTextColor="#64748B"
                value={mgrName}
                onChangeText={setMgrName}
              />
              <TextInput
                style={styles.input}
                placeholder="Manager Email (@xyzcompany.com) *"
                placeholderTextColor="#64748B"
                value={mgrEmail}
                onChangeText={setMgrEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Number of Rooms (Max: 20) *"
                placeholderTextColor="#64748B"
                value={numRooms}
                onChangeText={setNumRooms}
                keyboardType="numeric"
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ Manager ID will be auto-generated starting with <Text style={styles.codeText}>man[8 digits]</Text>. Default password is <Text style={styles.codeText}>Welcome123$</Text>.
                </Text>
              </View>

              <View style={styles.rowRight}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddFloorInput(false); setNumRooms('5'); }}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallAddBtn, (creatingFloorManager || !mgrName.trim() || !mgrEmail.trim()) && styles.disabledBtn]}
                  onPress={handleCreateFloorManager}
                  disabled={creatingFloorManager || !mgrName.trim() || !mgrEmail.trim()}
                >
                  <Text style={styles.smallAddBtnText}>
                    {creatingFloorManager ? 'Generating...' : `Create ${formatFloorName(nextFloorNum)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>Room Number</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={allFloors.length === 0 ? "Create a floor first" : "e.g. 101, B-12"}
              placeholderTextColor="#64748B"
              value={newRoomNumber}
              onChangeText={setNewRoomNumber}
              editable={allFloors.length > 0 && !submitting}
            />
            <TouchableOpacity
              style={[styles.addRoomBtn, (!newRoomNumber.trim() || submitting || allFloors.length === 0) && styles.addRoomBtnDisabled]}
              onPress={handleAddRoom}
              disabled={!newRoomNumber.trim() || submitting || allFloors.length === 0}
            >
              <Text style={styles.addRoomBtnText}>{submitting ? 'Adding...' : '➕ Add Room'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Room Search & List */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Active Rooms ({filteredRooms.length})</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search room or floor..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {(() => {
          // Sort unique floors ascending
          const uniqueFloors = Array.from(new Set(xe.map(r => String(r.floor_number)))).sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });

          return uniqueFloors.map(floorNum => {
            const floorRooms = xe
              .filter(r => String(r.floor_number) === String(floorNum))
              .sort((a, b) => (a.id || 0) - (b.id || 0)); // created order (id ASC)

            const mgr = (managers || []).find(m => String(m.floor_number) === String(floorNum));

            return (
              <View key={floorNum} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4, flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '800' }}>
                      🏢 {formatFloorName(floorNum)} {mgr ? `(${mgr.name})` : ''}
                    </Text>
                    <View style={{ backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 10 }}>Limit: {mgr ? mgr.room_limit : 5}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingLimitFloor(floorNum);
                        setNewLimitValue(String(mgr ? mgr.room_limit : 5));
                        setSelectedRoomIdsToDelete([]);
                      }}
                    >
                      <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }}>Edit Limit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>{floorRooms.length} rooms</Text>
                </View>

                {floorRooms.map((room) => {
                  const isEditing = editingId === room.id;
                  return (
                    <View key={room.id} style={styles.roomCard}>
                      {isEditing ? (
                        <View style={{ flex: 1, gap: 8 }}>
                          <TextInput
                            style={styles.input}
                            value={editingNumber}
                            onChangeText={setEditingNumber}
                            placeholder="Room Number"
                            placeholderTextColor="#64748B"
                          />
                          <View style={styles.row}>
                            <Text style={styles.label}>Floor: </Text>
                            <TextInput
                              style={[styles.input, { flex: 1, marginBottom: 0 }]}
                              value={editingFloor}
                              onChangeText={setEditingFloor}
                              placeholder="Floor"
                              placeholderTextColor="#64748B"
                            />
                          </View>
                          <View style={styles.rowRight}>
                            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveEdit(room.id)}>
                              <Text style={styles.btnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                              <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.roomInfo}>
                            <Text style={styles.roomTitle}>📍 Room {room.room_number}</Text>
                            <Text style={styles.floorText}>ID: {room.id} | {new Date(room.created_at || room.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                          </View>
                          <View style={styles.roomActions}>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={() => {
                                setEditingId(room.id);
                                setEditingNumber(String(room.room_number));
                                setEditingFloor(String(room.floor_number || '0'));
                              }}
                            >
                              <Text style={styles.btnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => he(room)}>
                              <Text style={styles.btnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          });
        })()}

        {/* Floor Manager & Room History Section */}
        <Text style={styles.historyTitle}>📋 Floor Manager & Room History</Text>
        {history.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.noFloorText}>No floor history recorded yet.</Text>
          </View>
        ) : (
          history.map((item) => {
            const roomsList = Array.isArray(item.rooms_details) ? item.rooms_details : JSON.parse(item.rooms_details || '[]');
            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '800' }}>
                    Floor {item.floor_number} ({formatFloorName(item.floor_number)})
                  </Text>
                  <View style={[styles.historyActionPill, { backgroundColor: item.action === 'created' ? '#064E3B' : '#7F1D1D', borderColor: item.action === 'created' ? '#065F46' : '#991B1B', borderWidth: 1 }]}>
                    <Text style={styles.actionText}>{item.action.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.historyMeta}>
                  Manager: <Text style={{ color: '#E2E8F0', fontWeight: '600' }}>{item.manager_name}</Text> ({item.manager_email})
                </Text>
                <Text style={styles.historyTime}>
                  Time: {new Date(item.created_at).toLocaleString()}
                </Text>

                <View style={styles.historyRoomsBox}>
                  <Text style={styles.historyRoomsTitle}>Rooms Allocated ({roomsList.length}):</Text>
                  {roomsList.length > 0 ? (
                    <View style={styles.historyRoomsList}>
                      {roomsList.map((rm, idx) => (
                        <View key={idx} style={styles.historyRoomBadge}>
                          <Text style={styles.historyRoomText}>{rm}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: '#64748B', fontSize: 10, fontStyle: 'italic' }}>None</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit Limit Modal */}
      <Modal visible={Boolean(editingLimitFloor)} transparent animationType="slide">
        {(() => {
          const mgr = (managers || []).find(m => String(m.floor_number) === String(editingLimitFloor));
          const floorRooms = (rooms || []).filter(r => String(r.floor_number) === String(editingLimitFloor)).sort((a,b) => (a.id || 0) - (b.id || 0));
          const currentLimit = mgr ? (mgr.room_limit || 0) : 5;
          const currentCount = floorRooms.length;

          const targetLimit = parseInt(newLimitValue, 10) || 0;
          const excessCount = currentCount - targetLimit;
          const isDecrease = excessCount > 0;

          return (
            <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
                <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
                  Edit Room Limit for {formatFloorName(editingLimitFloor)}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16 }}>
                  Current Limit: {currentLimit} | Active Rooms: {currentCount}
                </Text>

                <Text style={styles.label}>New Room Limit</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={newLimitValue}
                  onChangeText={(text) => {
                    setNewLimitValue(text);
                    const limitVal = parseInt(text, 10) || 0;
                    const reqCount = currentCount - limitVal;
                    if (reqCount > 0) {
                      const latestRooms = [...floorRooms].reverse().slice(0, reqCount);
                      setSelectedRoomIdsToDelete(latestRooms.map(r => r.id));
                    } else {
                      setSelectedRoomIdsToDelete([]);
                    }
                  }}
                />

                {isDecrease && (
                  <View style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.2)', padding: 12, borderRadius: 10, marginVertical: 12 }}>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                      ⚠️ Decreasing limit below active count
                    </Text>
                    <Text style={{ color: '#CBD5E1', fontSize: 11, marginBottom: 8 }}>
                      You must select exactly {excessCount} room(s) to delete:
                    </Text>

                    <ScrollView style={{ maxHeight: 120 }}>
                      {floorRooms.map(r => {
                        const isChecked = selectedRoomIdsToDelete.includes(r.id);
                        return (
                          <TouchableOpacity
                            key={r.id}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' }}
                            onPress={() => {
                              let updated = [...selectedRoomIdsToDelete];
                              if (isChecked) {
                                updated = updated.filter(id => id !== r.id);
                              } else {
                                updated.push(r.id);
                              }
                              setSelectedRoomIdsToDelete(updated);
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Room {r.room_number}</Text>
                            <Text style={{ color: isChecked ? '#6366F1' : '#64748B', fontSize: 14, fontWeight: '900' }}>
                              {isChecked ? '☑️' : '⬜'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={[styles.rowRight, { marginTop: 16 }]}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingLimitFloor(null)}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallAddBtn, (targetLimit < 1 || targetLimit > 20 || (isDecrease && selectedRoomIdsToDelete.length !== excessCount)) && styles.disabledBtn]}
                    onPress={handleSaveFloorLimit}
                    disabled={targetLimit < 1 || targetLimit > 20 || (isDecrease && selectedRoomIdsToDelete.length !== excessCount)}
                  >
                    <Text style={styles.smallAddBtnText}>Save Limit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  floorRow: { flexDirection: 'row', itemsCenter: 'center', gap: 8, marginBottom: 12 },
  floorChip: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#334155' },
  floorChipActive: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
  floorChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  floorChipTextActive: { color: '#FFFFFF' },
  noFloorPill: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  noFloorText: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
  warningBox: { backgroundColor: 'rgba(217, 119, 6, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', padding: 12, borderRadius: 8, marginBottom: 12 },
  warningText: { color: '#FCD34D', fontSize: 12, fontWeight: '600' },
  plusBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  plusBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addFloorBox: { backgroundColor: '#0F172A', padding: 14, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#4F46E5', gap: 8 },
  addFloorTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  highlightText: { color: '#818CF8' },
  subLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 4 },
  infoBox: { backgroundColor: '#1E293B', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  infoText: { color: '#94A3B8', fontSize: 11 },
  codeText: { color: '#818CF8', fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowRight: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10, color: '#F8FAFC', fontSize: 14, marginBottom: 8 },
  smallAddBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  smallAddBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addRoomBtn: { backgroundColor: '#6366F1', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  addRoomBtnDisabled: { backgroundColor: '#334155' },
  addRoomBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  searchInput: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, color: '#F8FAFC', fontSize: 12, width: 160 },
  roomCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomInfo: { gap: 2 },
  roomTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  floorText: { color: '#94A3B8', fontSize: 12 },
  roomActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  saveBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  // History elements
  historyTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  historyCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyActionPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  actionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  historyMeta: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  historyTime: { color: '#64748B', fontSize: 9, marginTop: 2 },
  historyRoomsBox: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 8, marginTop: 8 },
  historyRoomsTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  historyRoomsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  historyRoomBadge: { backgroundColor: '#334155', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyRoomText: { color: '#E2E8F0', fontSize: 10 },
});
