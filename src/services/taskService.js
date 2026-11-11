/**
 * Task Management & Occurrence Service
 * Implements full CRUD, recurrence engine, and occurrence-based status tracking
 */

import { execute, queryAll, queryFirst, runInTransaction } from '../database/database.js';
import {
  getTodayDateString,
  getDayOfWeek,
  isTaskOverdue,
  toDateString,
} from '../utils/dateUtils.js';
import { cancelTaskNotification, scheduleTaskNotification } from './notificationService.js';

/**
 * Checks if a recurring task rule matches a specific calendar date
 */
export const doesTaskRecurOnDate = (task, targetDate) => {
  // Task cannot recur before its original scheduled starting date
  if (targetDate < task.scheduled_date) {
    return false;
  }

  // Non-repeating tasks only match their exact scheduled date
  if (task.repeat_option === 'none') {
    return targetDate === task.scheduled_date;
  }

  // Daily recurring tasks occur every day
  if (task.repeat_option === 'daily') {
    return true;
  }

  const targetDayOfWeek = getDayOfWeek(targetDate); // 0 = Sun, 1 = Mon ... 6 = Sat

  // Weekdays: Monday (1) through Friday (5)
  if (task.repeat_option === 'weekdays') {
    return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
  }

  // Weekly: Matches same weekday as the scheduled date
  if (task.repeat_option === 'weekly') {
    const originalDayOfWeek = getDayOfWeek(task.scheduled_date);
    return targetDayOfWeek === originalDayOfWeek;
  }

  // Custom schedule: Check if target day of week is in repeat_days array
  if (task.repeat_option === 'custom') {
    try {
      const allowedDays = JSON.parse(task.repeat_days || '[]');
      return Array.isArray(allowedDays) && allowedDays.includes(targetDayOfWeek);
    } catch (e) {
      return false;
    }
  }

  return false;
};

/**
 * Synchronizes and materializes occurrences for a given target date
 * Ensures no duplicate occurrences are created and past statuses are strictly preserved
 */
export const syncOccurrencesForDate = async (targetDate = getTodayDateString()) => {
  try {
    // 1. Get all tasks scheduled on or before this date
    const allEligibleTasks = await queryAll(
      'SELECT * FROM tasks WHERE scheduled_date <= ?;',
      [targetDate]
    );

    if (!allEligibleTasks || allEligibleTasks.length === 0) {
      return;
    }

    // 2. Filter tasks that should occur on this target date
    const matchingTasks = allEligibleTasks.filter((task) =>
      doesTaskRecurOnDate(task, targetDate)
    );

    if (matchingTasks.length === 0) {
      return;
    }

    // 3. Batch insert occurrences using INSERT OR IGNORE to protect existing status
    await runInTransaction(async () => {
      for (const task of matchingTasks) {
        const occurrenceId = `occ_${task.id}_${targetDate}`;
        await execute(
          `INSERT OR IGNORE INTO task_occurrences (
            id, task_id, occurrence_date, status, completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, 'pending', NULL, datetime('now'), datetime('now'));`,
          [occurrenceId, task.id, targetDate]
        );
      }
    });
  } catch (error) {
    console.error('Error synchronizing task occurrences for date:', targetDate, error);
  }
};

/**
 * Synchronizes occurrences for the last N days up to today + upcoming 7 days
 * Handles app restarts, date changes, and historical gap filling seamlessly
 */
export const syncRecentOccurrences = async (daysBack = 30, daysForward = 7) => {
  try {
    const today = getTodayDateString();
    const [y, m, d] = today.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let offset = -daysBack; offset <= daysForward; offset++) {
      const cur = new Date(baseDate);
      cur.setDate(baseDate.getDate() + offset);
      const dateStr = toDateString(cur);
      await syncOccurrencesForDate(dateStr);
    }
  } catch (error) {
    console.error('Error synchronizing recent occurrences:', error);
  }
};

/**
 * Retrieves all task occurrences for a specific date with full master task details
 */
export const getTasksForDate = async (targetDate = getTodayDateString()) => {
  // Ensure occurrences are generated for this date
  await syncOccurrencesForDate(targetDate);

  const query = `
    SELECT 
      o.id AS occurrence_id,
      o.task_id,
      o.occurrence_date,
      o.status,
      o.completed_at,
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
      t.updated_at
    FROM task_occurrences o
    INNER JOIN tasks t ON o.task_id = t.id
    WHERE o.occurrence_date = ?
    ORDER BY t.scheduled_time ASC, t.created_at DESC;
  `;

  const rows = await queryAll(query, [targetDate]);

  // Enrich with live overdue calculation
  return rows.map((item) => ({
    ...item,
    isOverdue:
      item.status === 'pending' &&
      isTaskOverdue(item.occurrence_date, item.scheduled_time),
  }));
};

/**
 * Retrieves overdue pending occurrences from past dates
 */
export const getOverdueTasks = async () => {
  const today = getTodayDateString();
  const query = `
    SELECT 
      o.id AS occurrence_id,
      o.task_id,
      o.occurrence_date,
      o.status,
      o.completed_at,
      t.title,
      t.description,
      t.category,
      t.priority,
      t.scheduled_date,
      t.scheduled_time,
      t.repeat_option,
      t.notification_enabled
    FROM task_occurrences o
    INNER JOIN tasks t ON o.task_id = t.id
    WHERE o.occurrence_date < ? AND o.status = 'pending'
    ORDER BY o.occurrence_date DESC, t.scheduled_time ASC;
  `;

  const rows = await queryAll(query, [today]);
  return rows.map((r) => ({ ...r, isOverdue: true }));
};

/**
 * Retrieves all master tasks
 */
export const getAllMasterTasks = async () => {
  return await queryAll('SELECT * FROM tasks ORDER BY scheduled_date DESC, scheduled_time ASC;');
};

/**
 * Creates a new task and generates its initial occurrence
 */
export const createTask = async (taskData) => {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const task = {
    id: taskId,
    title: taskData.title.trim(),
    description: taskData.description ? taskData.description.trim() : '',
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'Medium',
    scheduled_date: taskData.scheduled_date || getTodayDateString(),
    scheduled_time: taskData.scheduled_time || '09:00',
    repeat_option: taskData.repeat_option || 'none',
    repeat_days: taskData.repeat_days ? JSON.stringify(taskData.repeat_days) : null,
    notification_enabled: taskData.notification_enabled !== false ? 1 : 0,
    created_at: now,
    updated_at: now,
  };

  await execute(
    `INSERT INTO tasks (
      id, title, description, category, priority, scheduled_date, scheduled_time,
      repeat_option, repeat_days, notification_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      task.id,
      task.title,
      task.description,
      task.category,
      task.priority,
      task.scheduled_date,
      task.scheduled_time,
      task.repeat_option,
      task.repeat_days,
      task.notification_enabled,
      task.created_at,
      task.updated_at,
    ]
  );

  // Generate occurrence for scheduled date
  const occurrenceId = `occ_${task.id}_${task.scheduled_date}`;
  await execute(
    `INSERT OR IGNORE INTO task_occurrences (
      id, task_id, occurrence_date, status, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'pending', NULL, datetime('now'), datetime('now'));`,
    [occurrenceId, task.id, task.scheduled_date]
  );

  // If recurring and today is after scheduled_date, sync for today as well
  const today = getTodayDateString();
  if (today !== task.scheduled_date && doesTaskRecurOnDate(task, today)) {
    await syncOccurrencesForDate(today);
  }

  // Schedule notification if enabled
  if (task.notification_enabled) {
    await scheduleTaskNotification({
      ...task,
      occurrence_date: task.scheduled_date,
    });
  }

  return task;
};

/**
 * Updates an existing master task
 */
export const updateTask = async (taskId, updateData) => {
  const existing = await queryFirst('SELECT * FROM tasks WHERE id = ?;', [taskId]);
  if (!existing) {
    throw new Error('Task not found');
  }

  const now = new Date().toISOString();
  const updated = {
    title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
    description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
    category: updateData.category || existing.category,
    priority: updateData.priority || existing.priority,
    scheduled_date: updateData.scheduled_date || existing.scheduled_date,
    scheduled_time: updateData.scheduled_time || existing.scheduled_time,
    repeat_option: updateData.repeat_option || existing.repeat_option,
    repeat_days: updateData.repeat_days !== undefined
      ? (typeof updateData.repeat_days === 'string' ? updateData.repeat_days : JSON.stringify(updateData.repeat_days))
      : existing.repeat_days,
    notification_enabled: updateData.notification_enabled !== undefined ? (updateData.notification_enabled ? 1 : 0) : existing.notification_enabled,
    updated_at: now,
  };

  await execute(
    `UPDATE tasks SET
      title = ?, description = ?, category = ?, priority = ?, scheduled_date = ?,
      scheduled_time = ?, repeat_option = ?, repeat_days = ?, notification_enabled = ?,
      updated_at = ?
    WHERE id = ?;`,
    [
      updated.title,
      updated.description,
      updated.category,
      updated.priority,
      updated.scheduled_date,
      updated.scheduled_time,
      updated.repeat_option,
      updated.repeat_days,
      updated.notification_enabled,
      updated.updated_at,
      taskId,
    ]
  );

  // Reschedule notification
  await cancelTaskNotification(taskId);
  if (updated.notification_enabled) {
    await scheduleTaskNotification({
      ...updated,
      id: taskId,
      occurrence_date: updated.scheduled_date,
    });
  }

  return { id: taskId, ...updated };
};

/**
 * Deletes a task, cascade deleting occurrences and canceling notifications
 */
export const deleteTask = async (taskId) => {
  // Cancel local notifications
  await cancelTaskNotification(taskId);

  // Delete from SQLite
  await runInTransaction(async () => {
    await execute('DELETE FROM task_occurrences WHERE task_id = ?;', [taskId]);
    await execute('DELETE FROM tasks WHERE id = ?;', [taskId]);
  });

  return true;
};

/**
 * Toggles an occurrence status between 'pending' and 'completed'
 * Maintains independent daily status
 */
export const toggleTaskOccurrenceStatus = async (occurrenceId, currentStatus) => {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

  await execute(
    `UPDATE task_occurrences SET
      status = ?,
      completed_at = ?,
      updated_at = datetime('now')
    WHERE id = ?;`,
    [newStatus, completedAt, occurrenceId]
  );

  // If completed, cancel any pending reminder for this task occurrence
  if (newStatus === 'completed') {
    const occ = await queryFirst('SELECT task_id FROM task_occurrences WHERE id = ?;', [occurrenceId]);
    if (occ) {
      await cancelTaskNotification(occ.task_id);
    }
  }

  return { occurrenceId, status: newStatus, completedAt };
};

/**
 * Retrieves dashboard statistics for a specific date (defaults to today)
 */
export const getDashboardStatsForDate = async (targetDate = getTodayDateString()) => {
  await syncOccurrencesForDate(targetDate);

  const statsQuery = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM task_occurrences
    WHERE occurrence_date = ?;
  `;

  const row = await queryFirst(statsQuery, [targetDate]);
  const total = row ? Number(row.total || 0) : 0;
  const completed = row ? Number(row.completed || 0) : 0;
  const pending = row ? Number(row.pending || 0) : 0;

  // Overdue count (past pending occurrences)
  const overdueRow = await queryFirst(
    'SELECT COUNT(*) as overdue FROM task_occurrences WHERE occurrence_date < ? AND status = "pending";',
    [targetDate]
  );
  const overdue = overdueRow ? Number(overdueRow.overdue || 0) : 0;

  // Completion percentage: (Completed / Total) * 100, or 0% if total is 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate,
    date: targetDate,
  };
};

