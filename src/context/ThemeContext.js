/**
 * Theme & User Profile Context
 * Provides dynamic light/dark theming and user profile state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../constants/colors';
import { queryFirst, execute } from '../database/database';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeModeState] = useState('system'); // 'light', 'dark', 'system'
  const [userName, setUserName] = useState('Satyam');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const row = await queryFirst('SELECT theme_mode, user_name FROM app_settings WHERE id = 1;');
      if (row) {
        if (row.theme_mode) setThemeModeState(row.theme_mode);
        if (row.user_name) setUserName(row.user_name);
      }
    } catch (e) {
      console.warn('Failed to load theme settings from db:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await execute('UPDATE app_settings SET theme_mode = ?, updated_at = datetime("now") WHERE id = 1;', [mode]);
    } catch (e) {
      console.error('Failed to update theme mode:', e);
    }
  };

  const updateUserName = async (name) => {
    const trimmed = name ? name.trim() : 'User';
    setUserName(trimmed);
    try {
      await execute('UPDATE app_settings SET user_name = ?, updated_at = datetime("now") WHERE id = 1;', [trimmed]);
    } catch (e) {
      console.error('Failed to update user name:', e);
    }
  };

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        themeMode,
        setThemeMode,
        userName,
        updateUserName,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

