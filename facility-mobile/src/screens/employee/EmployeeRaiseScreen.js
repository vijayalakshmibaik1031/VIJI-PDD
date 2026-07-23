import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { RoomPicker } from '../../components/RoomPicker';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';

export const EmployeeRaiseScreen = ({ navigation }) => {
  const { createComplaint, complaints, fetchRooms } = useComplaints();
  const { user } = useAuth();

  const [roomId, setRoomId] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Cleanliness', 'IT / Network', 'Other'];

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Build a set of room+category combos that are already escalated for this employee
  const escalatedKeys = useMemo(() => {
    const userId = user?.id || user?.userId;
    if (!userId || !Array.isArray(complaints)) return new Set();
    return new Set(
      complaints
        .filter((c) => (c.employeeId === userId || c.employee_id === userId) && c.status === 'escalated')
        .map((c) => `${c.roomId || c.room_id}__${c.category}`),
    );
  }, [complaints, user]);

  const currentKey = roomId && category ? `${roomId}__${category}` : null;
  const isEscalatedCombo = currentKey ? escalatedKeys.has(currentKey) : false;

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the facility issue in detail');
      return;
    }
    if (!roomId) {
      Alert.alert('Validation Error', 'Please select or enter a valid room number');
      return;
    }

    if (isEscalatedCombo) {
      Alert.alert('Escalated Issue', 'This complaint has been escalated to authority. No further complaints allowed for this room and category.');
      return;
    }

    setLoading(true);
    try {
      const complaintId = `COMP-${Date.now()}`;
      await createComplaint({
        id: complaintId,
        employeeId: user?.id || user?.userId || 'emp001',
        employeeName: user?.name || user?.userId || 'Employee',
        roomId: String(roomId),
        category,
        description: description.trim(),
      });
      setLoading(false);
      Alert.alert('Success', 'Complaint submitted successfully!', [
        { text: 'OK', onPress: () => {
          setDescription('');
        }},
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to submit complaint');
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Raise Complaint" subtitle="Report a facility issue to management" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Room Selection via RoomPicker Component */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Facility Room *</Text>
          <RoomPicker selected={roomId} onSelect={setRoomId} />
        </View>

        {/* Selected Room Confirmation */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Selected Room Number</Text>
          <TextInput
            style={styles.input}
            value={String(roomId)}
            onChangeText={setRoomId}
            placeholder="e.g. 101, B-12"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Category Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Issue Category *</Text>
          <View style={styles.catGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Escalation block warning */}
        {isEscalatedCombo && (
          <View style={styles.escalatedBox}>
            <Text style={styles.escalatedTitle}>🔺 Complaint Escalated to Authority</Text>
            <Text style={styles.escalatedText}>
              A complaint for Room {roomId} — {category} has already been escalated to the authority. You cannot raise another complaint for this room and category until it is resolved.
            </Text>
          </View>
        )}

        {/* Problem Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Problem Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide explicit details (e.g. AC unit leaking water over desk 4)..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, (loading || isEscalatedCombo) && styles.disabledBtn]} onPress={handleSubmit} disabled={loading || isEscalatedCombo}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Facility Ticket</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 18, paddingBottom: 40 },
  formGroup: { marginBottom: 18 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', paddingVertical: 4 },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  chipActiveText: { color: '#FFFFFF' },
  mutedText: { color: '#64748B', fontSize: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catBtnActive: { backgroundColor: '#4338CA', borderColor: '#6366F1' },
  catText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  escalatedBox: {
    backgroundColor: '#3B0764',
    borderColor: '#A855F7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  escalatedTitle: {
    color: '#F472B6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  escalatedText: {
    color: '#E9D5FF',
    fontSize: 12,
    lineHeight: 18,
  },
});
