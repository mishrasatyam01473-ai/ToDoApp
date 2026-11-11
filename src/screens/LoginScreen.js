/**
 * First-Time Access & App Gate Screen
 * Validates the personal access code and securely stores access verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { verifyAccessCode } from '../services/authService';
import { CONFIG } from '../constants/config';

export const LoginScreen = ({ onAccessGranted, isAppLock = false }) => {
  const { colors, isDark } = useTheme();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setErrorMessage('');

    if (!passcode.trim()) {
      setErrorMessage('Please enter the access code to continue.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await verifyAccessCode(passcode);

      if (result.success) {
        onAccessGranted();
      } else {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Logo / Badge */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Feather name="shield" size={36} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isAppLock ? 'Application Locked' : 'Personal Access Gate'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isAppLock
              ? 'Please enter your access code to unlock your dashboard.'
              : 'Enter your exclusive access code to configure and unlock your offline to-do and productivity workspace.'}
          </Text>

          {/* Passcode Input Field */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errorMessage ? colors.overdue : colors.cardBorder,
              },
            ]}
          >
            <Feather name="key" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Enter Access Code"
              placeholderTextColor={colors.textMuted}
              value={passcode}
              onChangeText={(text) => {
                setPasscode(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPasscode}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={() => setShowPasscode(!showPasscode)}
              style={styles.eyeButton}
            >
              <Feather
                name={showPasscode ? 'eye-off' : 'eye'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.overdue} />
              <Text style={[styles.errorText, { color: colors.overdue }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                  {isAppLock ? 'Unlock Application' : 'Verify & Continue'}
                </Text>
                <Feather
                  name="arrow-right"
                  size={18}
                  color={colors.textInverse}
                  style={styles.buttonIcon}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Subtle Security & Architecture Notice */}
          <View style={styles.noteContainer}>
            <Feather name="info" size={13} color={colors.textMuted} />
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              Client-side verification gate. All tasks and settings stay strictly on your device.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  noteText: {
    fontSize: 11,
    textAlign: 'center',
    marginLeft: 6,
    lineHeight: 16,
  },
});

