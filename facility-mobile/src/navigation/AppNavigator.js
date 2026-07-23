import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { EmployeeNavigator } from './EmployeeNavigator';
import { ManagerNavigator } from './ManagerNavigator';
import { AuthorityNavigator } from './AuthorityNavigator';

export const AppNavigator = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('Login'); // 'Login', 'Register', 'ResetPassword'
  const [resetParams, setResetParams] = useState({});

  React.useEffect(() => {
    if (!isAuthenticated) {
      setAuthScreen('Login');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'ResetPassword') {
      return (
        <ResetPasswordScreen
          route={{ params: resetParams }}
          navigation={{
            navigate: (screen) => setAuthScreen(screen),
          }}
        />
      );
    }
    if (authScreen === 'Register') {
      return (
        <RegisterScreen
          navigation={{
            navigate: (screen) => setAuthScreen(screen),
          }}
        />
      );
    }
    return (
      <LoginScreen
        navigation={{
          navigate: (screen, params) => {
            if (params) setResetParams(params);
            setAuthScreen(screen);
          },
        }}
      />
    );
  }

  const role = user?.role?.toLowerCase();

  switch (role) {
    case 'manager':
      return <ManagerNavigator />;
    case 'authority':
    case 'admin':
      return <AuthorityNavigator />;
    case 'employee':
    default:
      return <EmployeeNavigator />;
  }
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
