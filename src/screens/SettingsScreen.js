/**
 * Settings Screen
 * Manages notification schedules, theme selection, app lock, backup export/import, data reset, and about info
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { queryFirst, execute, clearAllData } from '../database/database';
import { CONFIG } from '../constants/config';
import { isAppLockEnabled, setAppLockEnabled } from '../services/authService';
import { exportData, exportDataAsCSV, importData } from '../services/backupService';
import {
  scheduleDailySummaryReminders,
  rescheduleAllPendingNotifications,
} from '../services/notificationService';

export const SettingsScreen = ({ navigation }) => {
  const { colors, isDark, themeMode, setThemeMode, userName, updateUserName } = useTheme();

  // Settings states
  const [masterNotifications, setMasterNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [dailySummaries, setDailySummaries] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [morningTime, setMorningTime] = useState('08:00');
  const [midmorningTime, setMidmorningTime] = useState('10:00');
  const [afternoonTime, setAfternoonTime] = useState('14:00');
  const [eveningTime, setEveningTime] = useState('18:00');
  const [nightTime, setNightTime] = useState('21:00');
  const [appLock, setAppLock] = useState(false);
  const [editingName, setEditingName] = useState(userName);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notifRow = await queryFirst('SELECT * FROM notification_settings WHERE id = 1;');
      if (notifRow) {
        setMasterNotifications(Boolean(notifRow.master_enabled));
        setTaskReminders(Boolean(notifRow.task_reminders_enabled));
        setDailySummaries(Boolean(notifRow.daily_summary_enabled));
        setOverdueAlerts(Boolean(notifRow.overdue_alerts_enabled));
        if (notifRow.morning_time) setMorningTime(notifRow.morning_time);
        if (notifRow.midmorning_time) setMidmorningTime(notifRow.midmorning_time);
        if (notifRow.afternoon_time) setAfternoonTime(notifRow.afternoon_time);
        if (notifRow.evening_time) setEveningTime(notifRow.evening_time);
        if (notifRow.night_time) setNightTime(notifRow.night_time);
      }

      const lockStatus = await isAppLockEnabled();
      setAppLock(lockStatus);
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  const handleToggleMasterNotifications = async (val) => {
    setMasterNotifications(val);
    await execute(
      'UPDATE notification_settings SET master_enabled = ?, updated_at = datetime("now") WHERE id = 1;',
      [val ? 1 : 0]
    );
    if (val) {
      await rescheduleAllPendingNotifications();
    }
  };

  const handleToggleTaskReminders = async (val) => {
    setTaskReminders(val);
    await execute(
      'UPDATE notification_settings SET task_reminders_enabled = ?, updated_at = datetime("now") WHERE id = 1;',
      [val ? 1 : 0]
    );
    await rescheduleAllPendingNotifications();
  };

  const handleToggleDailySummaries = async (val) => {
    setDailySummaries(val);
    await execute(
      'UPDATE notification_settings SET daily_summary_enabled = ?, updated_at = datetime("now") WHERE id = 1;',
      [val ? 1 : 0]
    );
    if (val) {
      await scheduleDailySummaryReminders();
    }
  };

  const handleToggleAppLock = async (val) => {
    setAppLock(val);
    await setAppLockEnabled(val);
  };

  const handleSaveName = async () => {
    await updateUserName(editingName);
    Alert.alert('Saved', 'Your display name has been updated.');
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    const result = await exportData();
    setIsExporting(false);
    if (!result.success) {
      Alert.alert('Export Failed', result.message);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    const result = await exportDataAsCSV();
    setIsExporting(false);
    if (!result.success) {
      Alert.alert('Export Failed', result.message);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Backup',
      'Importing will merge backup tasks into your local database. Do you wish to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setIsImporting(true);
            const result = await importData();
            setIsImporting(false);
            Alert.alert(result.success ? 'Success' : 'Error', result.message);
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Task Data',
      'Are you sure you want to permanently delete all tasks, occurrences, and completion history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Data Cleared', 'All tasks and historical records have been erased.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personalize notifications, security, and data storage
          </Text>
        </View>

        {/* Profile / Display Name Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>User Profile</Text>
          <View style={styles.profileRow}>
            <TextInput
              style={[
                styles.profileInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.profileSaveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveName}
            >
              <Text style={[styles.profileSaveBtnText, { color: colors.textInverse }]}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance & Themes */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Choose between light, dark, or system default theme
          </Text>

          <View style={styles.themeOptionsRow}>
            {[
              { id: 'light', label: 'Light', icon: 'sun' },
              { id: 'dark', label: 'Dark', icon: 'moon' },
              { id: 'system', label: 'System', icon: 'smartphone' },
            ].map((item) => {
              const isSelected = themeMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setThemeMode(item.id)}
                >
                  <Feather
                    name={item.icon}
                    size={16}
                    color={isSelected ? colors.textInverse : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications & Reminders */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notifications</Text>

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Enable Notifications
              </Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Master toggle for all local device notifications
              </Text>
            </View>
            <Switch
              value={masterNotifications}
              onValueChange={handleToggleMasterNotifications}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {masterNotifications && (
            <>
              <View style={[styles.settingItemRow, { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Individual Task Reminders
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Alert at the task's scheduled time
                  </Text>
                </View>
                <Switch
                  value={taskReminders}
                  onValueChange={handleToggleTaskReminders}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingItemRow, { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Daily Pending Summaries
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Periodic reminders if tasks remain pending (8 AM, 10 AM, 2 PM, 6 PM, 9 PM)
                  </Text>
                </View>
                <Switch
                  value={dailySummaries}
                  onValueChange={handleToggleDailySummaries}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}
        </View>

        {/* Security / App Lock */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security & Privacy</Text>

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Application Lock
              </Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Require personal access code every time the app opens
              </Text>
            </View>
            <Switch
              value={appLock}
              onValueChange={handleToggleAppLock}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Backup & Storage */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data & Backup</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            All records are stored 100% offline on your device in SQLite
          </Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}
              onPress={handleExportJSON}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Feather name="download" size={16} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Export JSON</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <Feather name="file-text" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}
              onPress={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Feather name="upload" size={16} color={colors.accent} />
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Import JSON</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Clear Data Danger Button */}
          <TouchableOpacity
            style={[styles.dangerBtn, { borderColor: colors.priorityHigh }]}
            onPress={handleClearAllData}
          >
            <Feather name="trash-2" size={16} color={colors.priorityHigh} style={{ marginRight: 6 }} />
            <Text style={[styles.dangerBtnText, { color: colors.priorityHigh }]}>
              Clear All Task Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Application */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Application</Text>
          
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>App Name</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>{CONFIG.APP_NAME}</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>v{CONFIG.APP_VERSION}</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Build</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>{CONFIG.BUILD_NUMBER}</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Author</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>{CONFIG.AUTHOR}</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Architecture</Text>
            <Text style={[styles.aboutValue, { color: colors.primary }]}>Offline First (Expo SQLite)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  profileInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  profileSaveBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  profileSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  aboutLabel: {
    fontSize: 13,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});

