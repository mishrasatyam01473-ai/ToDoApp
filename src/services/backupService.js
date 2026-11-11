/**
 * Local Backup & Export/Import Service
 * Safely exports all tasks, occurrences, and preferences to a local JSON file
 * Imports previously saved backup archives with transaction safety
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { queryAll, execute, runInTransaction } from '../database/database.js';
import { CONFIG } from '../constants/config.js';
import { getTodayDateString } from '../utils/dateUtils.js';

/**
 * Exports all database records to a JSON file and opens the native share dialog
 */
export const exportData = async () => {
  try {
    const tasks = await queryAll('SELECT * FROM tasks;');
    const occurrences = await queryAll('SELECT * FROM task_occurrences;');
    const notificationSettings = await queryAll('SELECT * FROM notification_settings;');
    const appSettings = await queryAll('SELECT * FROM app_settings;');

    const exportPayload = {
      app: CONFIG.APP_NAME,
      version: CONFIG.APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        tasks,
        occurrences,
        notificationSettings,
        appSettings,
      },
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const fileName = `DailyToDo_Backup_${getTodayDateString()}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Daily To-Do Backup',
        UTI: 'public.json',
      });
      return { success: true, message: 'Backup file generated and shared successfully.' };
    } else {
      return { success: true, message: `Backup saved to ${filePath}` };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.message || 'Failed to export data.' };
  }
};

/**
 * Exports data formatted as CSV string (tasks list)
 */
export const exportDataAsCSV = async () => {
  try {
    const tasks = await queryAll('SELECT * FROM tasks;');
    if (!tasks || tasks.length === 0) {
      return { success: false, message: 'No tasks to export.' };
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Scheduled Date',
      'Scheduled Time',
      'Repeat Option',
      'Notification Enabled',
      'Created At',
    ];

    const rows = tasks.map((t) => [
      `"${t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.scheduled_date}"`,
      `"${t.scheduled_time}"`,
      `"${t.repeat_option}"`,
      `"${t.notification_enabled}"`,
      `"${t.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const fileName = `DailyToDo_Tasks_${getTodayDateString()}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Tasks CSV',
        UTI: 'public.comma-separated-values-text',
      });
      return { success: true, message: 'CSV exported successfully.' };
    } else {
      return { success: true, message: `CSV saved to ${filePath}` };
    }
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, message: error.message || 'Failed to export CSV.' };
  }
};

/**
 * Prompts user to pick a backup JSON file and restores it into SQLite
 */
export const importData = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'File selection cancelled.' };
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed = JSON.parse(content);
    if (!parsed.data || !Array.isArray(parsed.data.tasks)) {
      return { success: false, message: 'Invalid backup format. Missing task records.' };
    }

    // Atomic transaction restore
    await runInTransaction(async () => {
      // Restore tasks
      for (const t of parsed.data.tasks) {
        await execute(
          `INSERT OR REPLACE INTO tasks (
            id, title, description, category, priority, scheduled_date, scheduled_time,
            repeat_option, repeat_days, notification_enabled, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.id,
            t.title,
            t.description,
            t.category,
            t.priority,
            t.scheduled_date,
            t.scheduled_time,
            t.repeat_option,
            t.repeat_days,
            t.notification_enabled,
            t.created_at,
            t.updated_at,
          ]
        );
      }

      // Restore occurrences if present
      if (Array.isArray(parsed.data.occurrences)) {
        for (const o of parsed.data.occurrences) {
          await execute(
            `INSERT OR REPLACE INTO task_occurrences (
              id, task_id, occurrence_date, status, completed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              o.id,
              o.task_id,
              o.occurrence_date,
              o.status,
              o.completed_at,
              o.created_at,
              o.updated_at,
            ]
          );
        }
      }
    });

    return {
      success: true,
      message: `Successfully imported ${parsed.data.tasks.length} tasks.`,
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: error.message || 'Failed to import backup.' };
  }
};

