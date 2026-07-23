import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useComplaints } from '../../context/ComplaintContext';

export const AuthorityRoomsScreen = () => {
  const { rooms, fetchRooms, createRoom, updateRoom, deleteRoom, loading } = useComplaints();

  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [customFloors, setCustomFloors] = useState([]);
  const [showAddFloorInput, setShowAddFloorInput] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [editingFloor, setEditingFloor] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Compute unique floors list sorted
  const allFloors = useMemo(() => {
    const set = new Set([
      ...rooms.map((r) => String(r.floor_number || '1')),
      ...customFloors,
    ]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [rooms, customFloors]);

  useEffect(() => {
    if (allFloors.length > 0 && !allFloors.includes(selectedFloor)) {
      setSelectedFloor(allFloors[0]);
    }
  }, [allFloors, selectedFloor]);

  const handleAddFloor = () => {
    if (!newFloorName.trim()) return;
    const normalized = newFloorName.trim();
    if (allFloors.includes(normalized)) {
      Alert.alert('Floor Exists', 'This floor choice is already in the list.');
      return;
    }
    setCustomFloors((prev) => [...prev, normalized]);
    setSelectedFloor(normalized);
    setNewFloorName('');
    setShowAddFloorInput(false);
    Alert.alert('Floor Added', `Floor ${normalized} added to floor choices.`);
  };

  const handleAddRoom = async () => {
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

    setSubmitting(true);
    try {
      await createRoom(normalized, selectedFloor);
      Alert.alert('Success', `Room ${normalized} added to Floor ${selectedFloor}.`);
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
      String(r.floor_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Manage Room Inventory" subtitle="Add, rename, or remove room numbers dynamically grouped by floor" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Floor Selection & Add Room Header Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>➕ Add New Room</Text>

          <Text style={styles.label}>Select Floor</Text>
          <View style={styles.floorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {allFloors.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.floorChip, selectedFloor === f && styles.floorChipActive]}
                  onPress={() => setSelectedFloor(f)}
                >
                  <Text style={[styles.floorChipText, selectedFloor === f && styles.floorChipTextActive]}>
                    Floor {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.plusBtn} onPress={() => setShowAddFloorInput(!showAddFloorInput)}>
              <Text style={styles.plusBtnText}>➕</Text>
            </TouchableOpacity>
          </View>

          {showAddFloorInput && (
            <View style={styles.addFloorBox}>
              <Text style={styles.label}>Create New Floor Level</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Floor (e.g. 6, Ground, Basement)"
                  placeholderTextColor="#64748B"
                  value={newFloorName}
                  onChangeText={setNewFloorName}
                />
                <TouchableOpacity style={styles.smallAddBtn} onPress={handleAddFloor}>
                  <Text style={styles.smallAddBtnText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>Room Number</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="e.g. 101, B-12"
              placeholderTextColor="#64748B"
              value={newRoomNumber}
              onChangeText={setNewRoomNumber}
            />
            <TouchableOpacity
              style={[styles.addRoomBtn, (!newRoomNumber.trim() || submitting) && styles.addRoomBtnDisabled]}
              onPress={handleAddRoom}
              disabled={!newRoomNumber.trim() || submitting}
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

        {filteredRooms.map((room) => {
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
                    <Text style={styles.floorText}>Floor Level: {room.floor_number || '1'}</Text>
                  </View>
                  <View style={styles.roomActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setEditingId(room.id);
                        setEditingNumber(String(room.room_number));
                        setEditingFloor(String(room.floor_number || '1'));
                      }}
                    >
                      <Text style={styles.btnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(room)}>
                      <Text style={styles.btnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  floorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  floorChip: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#334155' },
  floorChipActive: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
  floorChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  floorChipTextActive: { color: '#FFFFFF' },
  plusBtn: { backgroundColor: '#334155', padding: 8, borderRadius: 8 },
  plusBtnText: { fontSize: 14 },
  addFloorBox: { backgroundColor: '#0F172A', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowRight: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10, color: '#F8FAFC', fontSize: 14 },
  smallAddBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  smallAddBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addRoomBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
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
});
