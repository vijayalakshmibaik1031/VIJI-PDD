import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { AppNavigator } from './navigation/AppNavigator';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Application Error</Text>
            <Text style={styles.errorText}>
              {this.state.error?.toString() || 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={styles.retryText}>Reload App</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AuthProvider>
          <ComplaintProvider>
            <AppNavigator />
          </ComplaintProvider>
        </AuthProvider>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  errorText: {
    color: '#F8FAFC',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default App;
