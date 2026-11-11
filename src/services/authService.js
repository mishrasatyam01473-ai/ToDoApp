/**
 * Authentication & Access Control Service
 * Handles first-time passcode gate and local app-lock security using Expo SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config.js';
import { execute, queryFirst } from '../database/database.js';

/**
 * Checks if the user has successfully entered the access code previously
 */
export const isUserAuthenticated = async () => {
  try {
    const verified = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.AUTH_VERIFIED);
    return verified === 'true';
  } catch (error) {
    console.warn('SecureStore read error, fallback to false:', error);
    return false;
  }
};

/**
 * Validates the entered code against the required access code
 * Passcode: SatyamMishraToDoApp2026
 */
export const verifyAccessCode = async (enteredCode) => {
  if (!enteredCode || typeof enteredCode !== 'string') {
    return { success: false, message: 'Please enter the access code.' };
  }

  // Exact match validation
  if (enteredCode.trim() === CONFIG.ACCESS_PASSCODE) {
    try {
      // Securely store the verification status locally on the device
      await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.AUTH_VERIFIED, 'true');

      // Update app settings in SQLite
      await execute(
        'UPDATE app_settings SET has_completed_onboarding = 1, updated_at = datetime("now") WHERE id = 1;'
      );

      return { success: true, message: 'Access granted. Welcome!' };
    } catch (storeError) {
      console.warn('Could not save to SecureStore:', storeError);
      // Still allow entry if SecureStore had a platform hiccup
      return { success: true, message: 'Access granted.' };
    }
  }

  return {
    success: false,
    message: 'Invalid access code. Please check your credentials and try again.',
  };
};

/**
 * Checks if app-lock is enabled in user settings
 */
export const isAppLockEnabled = async () => {
  try {
    const row = await queryFirst('SELECT app_lock_enabled FROM app_settings WHERE id = 1;');
    return row ? Boolean(row.app_lock_enabled) : false;
  } catch (error) {
    return false;
  }
};

/**
 * Toggles the app-lock setting
 */
export const setAppLockEnabled = async (enabled) => {
  try {
    await execute(
      'UPDATE app_settings SET app_lock_enabled = ?, updated_at = datetime("now") WHERE id = 1;',
      [enabled ? 1 : 0]
    );
    await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.APP_LOCKED, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Failed to set app lock:', error);
    return false;
  }
};

/**
 * Resets authentication state (for testing / development)
 */
export const resetAuthentication = async () => {
  try {
    await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.AUTH_VERIFIED);
    await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.APP_LOCKED);
    await execute(
      'UPDATE app_settings SET has_completed_onboarding = 0, app_lock_enabled = 0, updated_at = datetime("now") WHERE id = 1;'
    );
    return true;
  } catch (error) {
    console.error('Failed to reset authentication:', error);
    return false;
  }
};

