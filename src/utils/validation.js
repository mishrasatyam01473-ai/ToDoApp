/**
 * Input validation helpers
 */

import { CONFIG } from '../constants/config.js';

export const validatePasscode = (inputCode) => {
  if (!inputCode || typeof inputCode !== 'string') {
    return { isValid: false, error: 'Please enter the access code.' };
  }
  const clean = inputCode.trim();
  if (clean === CONFIG.ACCESS_PASSCODE) {
    return { isValid: true, error: null };
  }
  return {
    isValid: false,
    error: 'Incorrect access code. Please check and try again.',
  };
};

export const validateTask = (task) => {
  const errors = {};

  if (!task.title || !task.title.trim()) {
    errors.title = 'Task title is required.';
  } else if (task.title.trim().length > 100) {
    errors.title = 'Title must be 100 characters or fewer.';
  }

  if (task.description && task.description.trim().length > 500) {
    errors.description = 'Description cannot exceed 500 characters.';
  }

  if (!task.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(task.scheduled_date)) {
    errors.scheduled_date = 'Valid scheduled date (YYYY-MM-DD) is required.';
  }

  if (!task.scheduled_time || !/^\d{2}:\d{2}$/.test(task.scheduled_time)) {
    errors.scheduled_time = 'Valid scheduled time (HH:mm) is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

