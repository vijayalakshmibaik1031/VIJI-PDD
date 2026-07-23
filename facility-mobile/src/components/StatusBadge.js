import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getStatusStyle = (status) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'pending':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D', label: 'PENDING' };
    case 'in-progress':
    case 'in_progress':
      return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD', label: 'IN PROGRESS' };
    case 'completed':
    case 'resolved':
      return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'COMPLETED' };
    case 'rejected':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', label: 'REJECTED' };
    case 'escalated':
      return { bg: '#FCE7F3', text: '#C026D3', border: '#F472B6', label: 'ESCALATED' };
    case 'merged_public':
    case 'merged':
      return { bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD', label: 'MERGED PUBLIC' };
    case 'acknowledged':
      return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74', label: 'ACKNOWLEDGED' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', label: status?.toUpperCase() || 'INFO' };
  }
};

export const StatusBadge = ({ status }) => {
  const style = getStatusStyle(status);
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
