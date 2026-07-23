import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EmployeeRaiseScreen } from '../screens/employee/EmployeeRaiseScreen';
import { EmployeePrivateScreen } from '../screens/employee/EmployeePrivateScreen';
import { EmployeePublicScreen } from '../screens/employee/EmployeePublicScreen';
import { EmployeeAccountScreen } from '../screens/employee/EmployeeAccountScreen';

export const EmployeeNavigator = () => {
  const [activeTab, setActiveTab] = useState('raise');

  const renderScreen = () => {
    switch (activeTab) {
      case 'raise':
        return <EmployeeRaiseScreen />;
      case 'private':
        return <EmployeePrivateScreen />;
      case 'public':
        return <EmployeePublicScreen />;
      case 'account':
        return <EmployeeAccountScreen />;
      default:
        return <EmployeeRaiseScreen />;
    }
  };

  const tabs = [
    { key: 'raise', label: 'Raise', icon: '📝' },
    { key: 'private', label: 'My Tickets', icon: '🔒' },
    { key: 'public', label: 'Community', icon: '🌐' },
    { key: 'account', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.flex}>
      <View style={styles.body}>{renderScreen()}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#312E81' },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: '#818CF8', fontWeight: '800' },
});
