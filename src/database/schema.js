/**
 * SQLite Database Schemas and Initial Statements
 */

export const SCHEMA_SQL = `
  -- Tasks Definition Table (Stores master task blueprint & recurrence rules)
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Personal',
    priority TEXT NOT NULL DEFAULT 'Medium',
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    repeat_option TEXT NOT NULL DEFAULT 'none',
    repeat_days TEXT,
    notification_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Task Occurrences Table (Daily instance completion records)
  CREATE TABLE IF NOT EXISTS task_occurrences (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    occurrence_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    UNIQUE(task_id, occurrence_date)
  );

  -- Notification Settings Table
  CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    master_enabled INTEGER NOT NULL DEFAULT 1,
    task_reminders_enabled INTEGER NOT NULL DEFAULT 1,
    daily_summary_enabled INTEGER NOT NULL DEFAULT 1,
    overdue_alerts_enabled INTEGER NOT NULL DEFAULT 1,
    morning_time TEXT NOT NULL DEFAULT '08:00',
    midmorning_time TEXT NOT NULL DEFAULT '10:00',
    afternoon_time TEXT NOT NULL DEFAULT '14:00',
    evening_time TEXT NOT NULL DEFAULT '18:00',
    night_time TEXT NOT NULL DEFAULT '21:00',
    updated_at TEXT NOT NULL
  );

  -- Application Configuration Settings
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme_mode TEXT NOT NULL DEFAULT 'system',
    app_lock_enabled INTEGER NOT NULL DEFAULT 0,
    user_name TEXT NOT NULL DEFAULT 'Satyam',
    has_completed_onboarding INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  -- Performance Indexes
  CREATE INDEX IF NOT EXISTS idx_occurrences_date ON task_occurrences(occurrence_date);
  CREATE INDEX IF NOT EXISTS idx_occurrences_task_date ON task_occurrences(task_id, occurrence_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_repeat ON tasks(repeat_option);
`;

export const INITIAL_SETTINGS_SEED = `
  INSERT OR IGNORE INTO notification_settings (
    id, master_enabled, task_reminders_enabled, daily_summary_enabled, overdue_alerts_enabled,
    morning_time, midmorning_time, afternoon_time, evening_time, night_time, updated_at
  ) VALUES (
    1, 1, 1, 1, 1, '08:00', '10:00', '14:00', '18:00', '21:00', datetime('now')
  );

  INSERT OR IGNORE INTO app_settings (
    id, theme_mode, app_lock_enabled, user_name, has_completed_onboarding, updated_at
  ) VALUES (
    1, 'system', 0, 'Satyam', 0, datetime('now')
  );
`;

