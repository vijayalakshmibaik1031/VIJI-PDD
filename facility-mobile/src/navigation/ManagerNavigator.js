import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ManagerOverviewScreen } from '../screens/manager/ManagerOverviewScreen';
import { ManagerPendingScreen } from '../screens/manager/ManagerPendingScreen';
import { ManagerMergeScreen } from '../screens/manager/ManagerMergeScreen';
import { ManagerInProgressScreen } from '../screens/manager/ManagerInProgressScreen';
import { ManagerCompletedScreen } from '../screens/manager/ManagerCompletedScreen';
import { ManagerEmployeesScreen } from '../screens/manager/ManagerEmployeesScreen';

export const ManagerNavigator = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <ManagerOverviewScreen />;
      case 'pending':
        return <ManagerPendingScreen />;
      case 'merge':
        return <ManagerMergeScreen />;
      case 'in-progress':
        return <ManagerInProgressScreen />;
      case 'completed':
        return <ManagerCompletedScreen />;
      case 'employees':
        return <ManagerEmployeesScreen />;
      default:
        return <ManagerOverviewScreen />;
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'merge', label: 'Merge Area', icon: '📦' },
    { key: 'in-progress', label: 'In Progress', icon: '⚡' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'employees', label: 'Staff', icon: '👥' },
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
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#312E81' },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  tabLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '600' },
  tabLabelActive: { color: '#818CF8', fontWeight: '800' },
});
