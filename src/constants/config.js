/**
 * Application Constants and Configuration
 * Daily To-Do & Productivity Tracker
 */

export const CONFIG = {
  APP_NAME: 'Daily Track & Achieve',
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '2026.11.1',
  AUTHOR: 'Satyam Mishra',
  
  // First-time access gate code
  // Required gate passcode: SatyamMishraToDoApp2026
  ACCESS_PASSCODE: 'SatyamMishraToDoApp2026',

  // Local Secure Storage Keys
  STORAGE_KEYS: {
    AUTH_VERIFIED: 'todo_app_auth_verified_v1',
    APP_LOCKED: 'todo_app_lock_enabled',
    USER_PROFILE: 'todo_app_user_profile',
    LAST_SYNC_DATE: 'todo_app_last_sync_date',
  },

  // Notification Scheduling Defaults
  DEFAULT_REMINDER_HOURS: [
    { id: 'morning', time: '08:00', title: 'Good Morning!', body: 'Check and plan your tasks for today.' },
    { id: 'midmorning', time: '10:00', title: 'Daily Check-in', body: 'You still have pending tasks waiting for your focus.' },
    { id: 'afternoon', time: '14:00', title: 'Afternoon Push', body: "Don't forget to complete your remaining tasks." },
    { id: 'evening', time: '18:00', title: 'Evening Wrap-Up', body: 'Your daily tasks are waiting! Finish strong.' },
    { id: 'night', time: '21:00', title: 'Daily Review', body: 'Review your daily productivity and celebrate your wins!' },
  ],

  // Recurrence Options
  REPEAT_OPTIONS: [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Every day' },
    { value: 'weekdays', label: 'Selected weekdays (Mon–Fri)' },
    { value: 'weekly', label: 'Every week' },
    { value: 'custom', label: 'Custom recurring schedule' },
  ],

  // Priorities
  PRIORITIES: [
    { value: 'Low', label: 'Low', color: '#10B981' },
    { value: 'Medium', label: 'Medium', color: '#F59E0B' },
    { value: 'High', label: 'High', color: '#EF4444' },
  ],

  // Weekdays map (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  WEEKDAYS: [
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' },
    { id: 0, name: 'Sunday', short: 'Sun' },
  ],
};

