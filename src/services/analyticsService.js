/**
 * Productivity Analytics Engine
 * Calculates comprehensive historical productivity statistics and graph datasets
 * All data is computed strictly from actual locally stored SQLite task occurrences
 */

import { queryAll, queryFirst } from '../database/database.js';
import {
  getLastNDays,
  getTodayDateString,
  subDays,
  getDayOfWeek,
  getDayShortName,
  formatDateShort,
} from '../utils/dateUtils.js';
import { syncOccurrencesForDate } from './taskService.js';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Calculates high-level summary metrics
 */
export const getProductivitySummary = async () => {
  const today = getTodayDateString();
  await syncOccurrencesForDate(today);

  // 1. Overall counts across all occurrences in SQLite
  const overallRow = await queryFirst(`
    SELECT 
      COUNT(*) AS total_created,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS total_pending
    FROM task_occurrences;
  `);

  const totalCreated = overallRow ? Number(overallRow.total_created || 0) : 0;
  const totalCompleted = overallRow ? Number(overallRow.total_completed || 0) : 0;
  const totalPending = overallRow ? Number(overallRow.total_pending || 0) : 0;

  // 2. Overdue tasks count
  const overdueRow = await queryFirst(`
    SELECT COUNT(*) AS overdue_count
    FROM task_occurrences
    WHERE occurrence_date < ? AND status = 'pending';
  `, [today]);
  const totalOverdue = overdueRow ? Number(overdueRow.overdue_count || 0) : 0;

  // 3. Overall completion percentage
  const overallCompletionRate =
    totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // 4. Daily completion rates across all recorded dates
  const dailyBreakdown = await queryAll(`
    SELECT 
      occurrence_date,
      COUNT(*) AS day_total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS day_completed
    FROM task_occurrences
    GROUP BY occurrence_date;
  `);

  let avgDailyCompletionRate = 0;
  if (dailyBreakdown && dailyBreakdown.length > 0) {
    const sumRates = dailyBreakdown.reduce((sum, day) => {
      const rate = day.day_total > 0 ? (day.day_completed / day.day_total) * 100 : 0;
      return sum + rate;
    }, 0);
    avgDailyCompletionRate = Math.round(sumRates / dailyBreakdown.length);
  }

  // 5. Day-of-week productivity performance (Most & Least productive day)
  const dayPerformanceMap = {
    0: { total: 0, completed: 0, name: 'Sunday' },
    1: { total: 0, completed: 0, name: 'Monday' },
    2: { total: 0, completed: 0, name: 'Tuesday' },
    3: { total: 0, completed: 0, name: 'Wednesday' },
    4: { total: 0, completed: 0, name: 'Thursday' },
    5: { total: 0, completed: 0, name: 'Friday' },
    6: { total: 0, completed: 0, name: 'Saturday' },
  };

  dailyBreakdown.forEach((row) => {
    const dow = getDayOfWeek(row.occurrence_date);
    if (dayPerformanceMap[dow]) {
      dayPerformanceMap[dow].total += Number(row.day_total);
      dayPerformanceMap[dow].completed += Number(row.day_completed);
    }
  });

  let mostProductiveDay = 'N/A';
  let leastProductiveDay = 'N/A';
  let highestRate = -1;
  let lowestRate = 101;

  Object.values(dayPerformanceMap).forEach((item) => {
    if (item.total > 0) {
      const rate = (item.completed / item.total) * 100;
      if (rate > highestRate) {
        highestRate = rate;
        mostProductiveDay = item.name;
      }
      if (rate < lowestRate) {
        lowestRate = rate;
        leastProductiveDay = item.name;
      }
    }
  });

  // 6. Streak Calculations (Current & Longest consecutive days with completed tasks)
  const { currentStreak, longestStreak } = calculateStreaks(dailyBreakdown, today);

  return {
    totalCreated,
    totalCompleted,
    totalPending,
    totalOverdue,
    overallCompletionRate,
    avgDailyCompletionRate,
    mostProductiveDay,
    leastProductiveDay,
    currentStreak,
    longestStreak,
  };
};

/**
 * Calculates current and longest streaks of active task completion
 */
const calculateStreaks = (dailyRecords, todayStr) => {
  if (!dailyRecords || dailyRecords.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Map of completed dates
  const completedDateMap = new Set();
  dailyRecords.forEach((r) => {
    if (Number(r.day_completed) > 0) {
      completedDateMap.add(r.occurrence_date);
    }
  });

  // Calculate current streak backward starting from today (or yesterday if today has no completed yet)
  let currentStreak = 0;
  let checkDate = todayStr;

  if (completedDateMap.has(checkDate)) {
    while (completedDateMap.has(checkDate)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  } else {
    // If today is not yet completed, check if streak from yesterday is still alive
    checkDate = subDays(todayStr, 1);
    while (completedDateMap.has(checkDate)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Calculate longest streak across sorted distinct dates
  const sortedDates = Array.from(completedDateMap).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDate = null;

  for (const dateStr of sortedDates) {
    if (!previousDate) {
      tempStreak = 1;
    } else {
      const expectedNext = subDays(dateStr, -1); // dateStr - 1 day should equal previousDate
      if (subDays(dateStr, 1) === previousDate) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    previousDate = dateStr;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
};

/**
 * Line Graph Dataset Generator (Productivity Trend)
 * Supports 7-day, 30-day, and 90-day timeframes
 */
export const getLineChartData = async (daysCount = 7) => {
  const dates = getLastNDays(daysCount);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const rows = await queryAll(
    `SELECT 
      occurrence_date,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM task_occurrences
    WHERE occurrence_date >= ? AND occurrence_date <= ?
    GROUP BY occurrence_date;`,
    [startDate, endDate]
  );

  const rowMap = {};
  rows.forEach((r) => {
    rowMap[r.occurrence_date] = {
      total: Number(r.total || 0),
      completed: Number(r.completed || 0),
    };
  });

  const points = dates.map((dateStr) => {
    const data = rowMap[dateStr] || { total: 0, completed: 0 };
    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    return {
      date: dateStr,
      label: formatDateShort(dateStr),
      completionRate: rate,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
    };
  });

  const hasData = points.some((p) => p.total > 0);

  return {
    timeframe: daysCount,
    points,
    hasData,
  };
};

/**
 * Bar Graph Dataset Generator (Completed vs Pending Comparison)
 * Supports 'weekly' (last 7 or 14 days) and 'monthly' (grouped by week / 4 weeks)
 */
export const getBarChartData = async (mode = 'weekly') => {
  if (mode === 'weekly') {
    // Last 7 days breakdown
    const dates = getLastNDays(7);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const rows = await queryAll(
      `SELECT 
        occurrence_date,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
      FROM task_occurrences
      WHERE occurrence_date >= ? AND occurrence_date <= ?
      GROUP BY occurrence_date;`,
      [startDate, endDate]
    );

    const rowMap = {};
    rows.forEach((r) => {
      rowMap[r.occurrence_date] = {
        completed: Number(r.completed || 0),
        pending: Number(r.pending || 0),
      };
    });

    const bars = dates.map((dateStr) => {
      const data = rowMap[dateStr] || { completed: 0, pending: 0 };
      return {
        label: getDayShortName(dateStr),
        date: dateStr,
        completed: data.completed,
        pending: data.pending,
        total: data.completed + data.pending,
      };
    });

    const hasData = bars.some((b) => b.total > 0);
    return { mode: 'weekly', bars, hasData };
  } else {
    // Monthly view: Group into last 4 rolling weeks (7 days each)
    const weeks = [];
    const today = getTodayDateString();

    for (let i = 3; i >= 0; i--) {
      const weekEndDate = subDays(today, i * 7);
      const weekStartDate = subDays(weekEndDate, 6);

      const row = await queryFirst(
        `SELECT 
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
        FROM task_occurrences
        WHERE occurrence_date >= ? AND occurrence_date <= ?;`,
        [weekStartDate, weekEndDate]
      );

      const completed = row ? Number(row.completed || 0) : 0;
      const pending = row ? Number(row.pending || 0) : 0;

      weeks.push({
        label: `Wk ${4 - i}`,
        range: `${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`,
        completed,
        pending,
        total: completed + pending,
      });
    }

    const hasData = weeks.some((w) => w.total > 0);
    return { mode: 'monthly', bars: weeks, hasData };
  }
};

/**
 * Dot Graph Dataset Generator (Daily Productivity Grid / Habit Matrix)
 * Supports 30-day and 90-day views
 * Levels: 0 = 0% or no tasks, 1 = 1-49%, 2 = 50-79%, 3 = 80-100%
 */
export const getDotChartData = async (daysCount = 30) => {
  const dates = getLastNDays(daysCount);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const rows = await queryAll(
    `SELECT 
      occurrence_date,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM task_occurrences
    WHERE occurrence_date >= ? AND occurrence_date <= ?
    GROUP BY occurrence_date;`,
    [startDate, endDate]
  );

  const rowMap = {};
  rows.forEach((r) => {
    rowMap[r.occurrence_date] = {
      total: Number(r.total || 0),
      completed: Number(r.completed || 0),
    };
  });

  const dots = dates.map((dateStr) => {
    const data = rowMap[dateStr] || { total: 0, completed: 0 };
    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

    let level = 0;
    if (data.total > 0) {
      if (rate >= 80) level = 3;
      else if (rate >= 50) level = 2;
      else if (rate > 0) level = 1;
      else level = 0;
    }

    return {
      date: dateStr,
      label: formatDateShort(dateStr),
      dayName: getDayShortName(dateStr),
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      completionRate: rate,
      level,
    };
  });

  const hasData = dots.some((d) => d.total > 0);

  return {
    timeframe: daysCount,
    dots,
    hasData,
  };
};

