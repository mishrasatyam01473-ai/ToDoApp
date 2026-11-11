/**
 * Local Notification Service
 * Configures channels, schedules smart task reminders, and manages daily check-ins
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { queryAll, queryFirst } from '../database/database.js';
import { parseDateTime, getTodayDateString } from '../utils/dateUtils.js';
import { CONFIG } from '../constants/config.js';

// Configure default notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CHANNEL_ID = 'todo-reminders';

/**
 * Initializes notification permissions and Android channels
 */
export const initNotifications = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Task & Productivity Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0D9488',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error initializing notifications:', error);
    return false;
  }
};

/**
 * Schedules a single local notification for an upcoming task occurrence
 */
export const scheduleTaskNotification = async (task) => {
  try {
    const settings = await queryFirst('SELECT * FROM notification_settings WHERE id = 1;');
    if (settings && (!settings.master_enabled || !settings.task_reminders_enabled)) {
      return null;
    }

    if (!task || !task.notification_enabled) {
      return null;
    }

    const targetDateStr = task.occurrence_date || task.scheduled_date;
    const triggerDate = parseDateTime(targetDateStr, task.scheduled_time);

    // Only schedule if the trigger time is in the future
    const now = new Date();
    if (triggerDate <= now) {
      return null;
    }

    const notificationId = `task_notif_${task.id}`;

    // Cancel any existing notification with this ID first
    await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `Task Reminder: ${task.title}`,
        body: task.description ? task.description : `Scheduled for ${task.scheduled_time}`,
        data: { taskId: task.id, date: targetDateStr },
        sound: true,
        channelId: CHANNEL_ID,
      },
      trigger: triggerDate,
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule task notification:', error);
    return null;
  }
};

/**
 * Cancels any scheduled notification for a specific task
 */
export const cancelTaskNotification = async (taskId) => {
  try {
    const notificationId = `task_notif_${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // Ignore error if not scheduled
  }
};

/**
 * Reschedules daily pending reminders (e.g. 8 AM, 10 AM, 2 PM, 6 PM, 9 PM)
 * Only alerts the user if there are pending tasks
 */
export const scheduleDailySummaryReminders = async () => {
  try {
    const settings = await queryFirst('SELECT * FROM notification_settings WHERE id = 1;');
    if (!settings || !settings.master_enabled || !settings.daily_summary_enabled) {
      return;
    }

    const reminderSlots = [
      { id: 'daily_morning', time: settings.morning_time || '08:00', title: 'Good Morning!', body: 'Check your daily goals and start strong!' },
      { id: 'daily_midmorning', time: settings.midmorning_time || '10:00', title: 'Pending Tasks Reminder', body: 'Keep up the momentum on your tasks today.' },
      { id: 'daily_afternoon', time: settings.afternoon_time || '14:00', title: 'Afternoon Check-in', body: 'Review remaining tasks for this afternoon.' },
      { id: 'daily_evening', time: settings.evening_time || '18:00', title: 'Evening Wrap-Up', body: 'Finish your daily tasks before the day ends!' },
      { id: 'daily_night', time: settings.night_time || '21:00', title: 'Daily Productivity Review', body: 'Check your productivity stats for today.' },
    ];

    for (const slot of reminderSlots) {
      await Notifications.cancelScheduledNotificationAsync(slot.id).catch(() => {});

      const [hours, mins] = slot.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: slot.id,
        content: {
          title: slot.title,
          body: slot.body,
          sound: true,
          channelId: CHANNEL_ID,
        },
        trigger: {
          hour: hours,
          minute: mins,
          repeats: true,
        },
      });
    }
  } catch (error) {
    console.warn('Failed to schedule daily reminders:', error);
  }
};

/**
 * Re-evaluates and schedules all upcoming notifications on app launch
 */
export const rescheduleAllPendingNotifications = async () => {
  try {
    const today = getTodayDateString();
    const query = `
      SELECT o.id as occurrence_id, o.task_id, o.occurrence_date, o.status,
             t.title, t.description, t.scheduled_time, t.notification_enabled
      FROM task_occurrences o
      JOIN tasks t ON o.task_id = t.id
      WHERE o.occurrence_date >= ? AND o.status = 'pending' AND t.notification_enabled = 1;
    `;
    const pendingUpcoming = await queryAll(query, [today]);

    for (const item of pendingUpcoming) {
      await scheduleTaskNotification({
        id: item.task_id,
        title: item.title,
        description: item.description,
        scheduled_time: item.scheduled_time,
        occurrence_date: item.occurrence_date,
        notification_enabled: item.notification_enabled,
      });
    }

    await scheduleDailySummaryReminders();
  } catch (error) {
    console.warn('Failed to reschedule pending notifications:', error);
  }
};

