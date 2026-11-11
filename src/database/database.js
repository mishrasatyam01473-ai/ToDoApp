/**
 * SQLite Database Connection and Helpers
 * Uses modern Expo SQLite API (SDK 58 compatible)
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, INITIAL_SETTINGS_SEED } from './schema.js';
import { applyMigrations } from './migrations.js';

let dbInstance = null;

/**
 * Initializes and returns the local SQLite database
 */
export const getDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await SQLite.openDatabaseAsync('todo_master.db');
    
    // Enable Write-Ahead Logging and Foreign Key constraints
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // Execute table schemas and seed defaults
    await db.execAsync(SCHEMA_SQL);
    await db.execAsync(INITIAL_SETTINGS_SEED);

    // Run version migrations
    await applyMigrations(db);

    dbInstance = db;
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Executes a query that returns multiple rows
 */
export const queryAll = async (sql, params = []) => {
  const db = await getDatabase();
  return await db.getAllAsync(sql, params);
};

/**
 * Executes a query that returns a single row
 */
export const queryFirst = async (sql, params = []) => {
  const db = await getDatabase();
  return await db.getFirstAsync(sql, params);
};

/**
 * Executes an INSERT, UPDATE, or DELETE statement
 */
export const execute = async (sql, params = []) => {
  const db = await getDatabase();
  return await db.runAsync(sql, params);
};

/**
 * Executes a batch of raw SQL commands
 */
export const execRaw = async (sql) => {
  const db = await getDatabase();
  return await db.execAsync(sql);
};

/**
 * Executes operations inside an atomic transaction
 */
export const runInTransaction = async (action) => {
  const db = await getDatabase();
  return await db.withTransactionAsync(action);
};

/**
 * Completely clears all user tasks and occurrences while preserving settings
 */
export const clearAllData = async () => {
  const db = await getDatabase();
  return await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM task_occurrences;
      DELETE FROM tasks;
    `);
  });
};

