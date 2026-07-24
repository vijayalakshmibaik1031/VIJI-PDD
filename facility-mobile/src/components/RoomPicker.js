import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useComplaints } from '../context/ComplaintContext';

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

export const RoomPicker = ({ selected, onSelect }) => {
  const { rooms } = useComplaints();
  const [activeFloor, setActiveFloor] = useState(null);

  // Group rooms by floor_number
  const groups = {};
  rooms.forEach((room) => {
    const floor = room.floor_number || '0';
    if (!groups[floor]) {
      groups[floor] = [];
    }
    groups[floor].push(room.room_number);
  });

  const sortedFloors = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Auto-set the active floor to the selected room's floor
  useEffect(() => {
    if (selected) {
      const foundRoom = rooms.find((r) => r.room_number === selected);
      if (foundRoom && foundRoom.floor_number) {
        setActiveFloor(foundRoom.floor_number);
      }
    }
  }, [selected, rooms]);

  if (rooms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>⚠️ No rooms configured in system. Contact Authority.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Select Floor Level:</Text>
      {/* Floor Pills Grid */}
      <View style={styles.floorsGrid}>
        {sortedFloors.map((floor) => {
          const isActive = activeFloor === floor;
          return (
            <TouchableOpacity
              key={floor}
              style={[styles.floorBtn, isActive && styles.floorBtnActive]}
              onPress={() => setActiveFloor(isActive ? null : floor)}
            >
              <Text style={[styles.floorBtnText, isActive && styles.floorBtnTextActive]}>
                🏢 {formatFloorName(floor)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Accordion drawers for rooms on active floor */}
      {sortedFloors.map((floor) => {
        if (activeFloor !== floor) return null;
        return (
          <View key={floor} style={styles.drawer}>
            <Text style={styles.drawerTitle}>Rooms on Floor {floor}</Text>
            <View style={styles.roomsGrid}>
              {groups[floor].map((roomNum) => {
                const isSelected = selected === roomNum;
                return (
                  <TouchableOpacity
                    key={roomNum}
                    style={[styles.roomBtn, isSelected && styles.roomBtnSelected]}
                    onPress={() => onSelect(roomNum)}
                  >
                    <Text style={[styles.roomBtnText, isSelected && styles.roomBtnTextSelected]}>
                      Room {roomNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontStyle: 'italic',
  },
  floorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  floorBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  floorBtnActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  floorBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  floorBtnTextActive: {
    color: '#818CF8',
    fontWeight: '800',
  },
  drawer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  drawerTitle: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  roomBtnSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#818CF8',
  },
  roomBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  roomBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
