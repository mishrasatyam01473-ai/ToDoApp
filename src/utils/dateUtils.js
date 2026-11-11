/**
 * Date and Time Utilities
 * Provides consistent formatting, calculations, and timezone-safe date strings (YYYY-MM-DD)
 */

/**
 * Returns today's date in local 'YYYY-MM-DD' format
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object or YYYY-MM-DD to 'YYYY-MM-DD'
 */
export const toDateString = (date) => {
  if (!date) return getTodayDateString();
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a YYYY-MM-DD string to a readable format
 * e.g., 'Wednesday, Nov 11, 2026'
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a YYYY-MM-DD string to short format
 * e.g., 'Nov 11'
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a 24-hr 'HH:mm' time string to 12-hr display with AM/PM
 * e.g., '14:30' -> '2:30 PM', '08:05' -> '8:05 AM'
 */
export const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  const [hoursStr, minsStr] = timeString.split(':');
  let hours = parseInt(hoursStr, 10);
  const mins = minsStr || '00';
  if (isNaN(hours)) return timeString;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  return `${hours}:${mins} ${period}`;
};

/**
 * Returns Day of Week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export const getDayOfWeek = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/**
 * Returns weekday short name: 'Mon', 'Tue', etc.
 */
export const getDayShortName = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Adds N days to a 'YYYY-MM-DD' string
 */
export const addDays = (dateString, n) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return toDateString(date);
};

/**
 * Subtracts N days from a 'YYYY-MM-DD' string
 */
export const subDays = (dateString, n) => {
  return addDays(dateString, -n);
};

/**
 * Checks if dateString is strictly before today
 */
export const isPastDate = (dateString) => {
  const today = getTodayDateString();
  return dateString < today;
};

/**
 * Checks if date is today
 */
export const isToday = (dateString) => {
  return dateString === getTodayDateString();
};

/**
 * Checks if date is in the future
 */
export const isFutureDate = (dateString) => {
  const today = getTodayDateString();
  return dateString > today;
};

/**
 * Checks if a task scheduled at (dateStr, timeStr) is overdue right now
 */
export const isTaskOverdue = (dateStr, timeStr) => {
  const today = getTodayDateString();
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  // If today, check time
  if (!timeStr) return false;
  const now = new Date();
  const currentHours = now.getHours();
  const currentMins = now.getMinutes();
  const [h, m] = timeStr.split(':').map(Number);
  return currentHours > h || (currentHours === h && currentMins > m);
};

/**
 * Generates an array of date strings for the last N days (inclusive of today)
 */
export const getLastNDays = (n) => {
  const result = [];
  const today = getTodayDateString();
  for (let i = n - 1; i >= 0; i--) {
    result.push(subDays(today, i));
  }
  return result;
};

/**
 * Combines dateString and timeString into a valid Date object
 */
export const parseDateTime = (dateString, timeString = '00:00') => {
  const [y, m, d] = dateString.split('-').map(Number);
  const [hours, mins] = timeString.split(':').map(Number);
  return new Date(y, m - 1, d, hours || 0, mins || 0, 0);
};

/**
 * Greeting based on current local hour
 */
export const getGreeting = (name = 'User') => {
  const hour = new Date().getHours();
  let greeting = 'Hello';
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }
  return name ? `${greeting}, ${name}` : greeting;
};

