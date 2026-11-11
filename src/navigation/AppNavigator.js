/**
 * Navigation Architecture
 * Implements Bottom Tab Navigator with Home, Tasks, Analytics, History, and Settings
 * Protected by First-Time Login Access Gate and App Lock
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { isUserAuthenticated, isAppLockEnabled } from '../services/authService';
import { syncRecentOccurrences } from '../services/taskService';
import {
  initNotifications,
  rescheduleAllPendingNotifications,
} from '../services/notificationService';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const { colors, isDark } = useTheme();

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    bootstrapApp();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        await rescheduleAllPendingNotifications();
        const authenticated = await isUserAuthenticated();
        if (authenticated) {
          const lockEnabled = await isAppLockEnabled();
          if (lockEnabled) {
            setIsLocked(true);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const bootstrapApp = async () => {
    try {
      // 1. Initialize notification channels and permissions
      await initNotifications();

      // 2. Synchronize recurring task occurrences for recent dates & upcoming week
      await syncRecentOccurrences(30, 7);

      // 3. Reschedule active notifications
      await rescheduleAllPendingNotifications();

      // 4. Check first-time authentication status
      const authenticated = await isUserAuthenticated();
      setIsAuthenticated(authenticated);

      // 5. Check if App Lock is enabled
      if (authenticated) {
        const lockEnabled = await isAppLockEnabled();
        setIsLocked(lockEnabled);
      }
    } catch (e) {
      console.warn('Bootstrap error:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleAccessGranted = () => {
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  if (isLoadingAuth) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 1. First-time access gate
  if (!isAuthenticated) {
    return (
      <LoginScreen onAccessGranted={handleAccessGranted} isAppLock={false} />
    );
  }

  // 2. App Lock gate
  if (isLocked) {
    return (
      <LoginScreen onAccessGranted={handleAccessGranted} isAppLock={true} />
    );
  }

  // Navigation theme config
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      border: colors.cardBorder,
      primary: colors.primary,
      text: colors.textPrimary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Home':
                iconName = 'home';
                break;
              case 'Tasks':
                iconName = 'check-square';
                break;
              case 'Analytics':
                iconName = 'bar-chart-2';
                break;
              case 'History':
                iconName = 'clock';
                break;
              case 'Settings':
                iconName = 'settings';
                break;
              default:
                iconName = 'circle';
            }
            return <Feather name={iconName} size={size || 20} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

