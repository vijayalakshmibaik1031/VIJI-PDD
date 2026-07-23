import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthorityOverviewScreen } from '../screens/authority/AuthorityOverviewScreen';
import { AuthorityEscalatedScreen } from '../screens/authority/AuthorityEscalatedScreen';
import { AuthorityRoomsScreen } from '../screens/authority/AuthorityRoomsScreen';
import { AuthorityUsersScreen } from '../screens/authority/AuthorityUsersScreen';
import { AuthorityAllScreen } from '../screens/authority/AuthorityAllScreen';

export const AuthorityNavigator = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <AuthorityOverviewScreen navigation={{ navigate: (screen) => setActiveTab(screen === 'AuthorityEscalated' ? 'escalated' : screen === 'AuthorityRooms' ? 'rooms' : screen === 'AuthorityUsers' ? 'users' : screen === 'AuthorityAll' ? 'all' : 'overview') }} />;
      case 'escalated':
        return <AuthorityEscalatedScreen />;
      case 'all':
        return <AuthorityAllScreen />;
      case 'rooms':
        return <AuthorityRoomsScreen />;
      case 'users':
        return <AuthorityUsersScreen />;
      default:
        return <AuthorityOverviewScreen />;
    }
  };

  const tabs = [
    { key: 'overview', label: 'Audit', icon: '🏛️' },
    { key: 'escalated', label: 'Alerts', icon: '🚨' },
    { key: 'all', label: 'All Logs', icon: '📋' },
    { key: 'rooms', label: 'Rooms', icon: '🏢' },
    { key: 'users', label: 'Accounts', icon: '🔑' },
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
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#312E81' },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  tabLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  tabLabelActive: { color: '#818CF8', fontWeight: '800' },
});
