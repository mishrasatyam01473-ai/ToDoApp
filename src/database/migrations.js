/**
 * Database Migrations System
 */

export const MIGRATIONS = [
  {
    version: 1,
    description: 'Initial schema setup for tasks, occurrences, and settings',
    run: async (db) => {
      // Version 1 is covered by schema.js
      return true;
    },
  },
];

export const applyMigrations = async (db) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    const result = await db.getAllAsync(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;'
    );
    const currentVersion = result && result.length > 0 ? result[0].version : 0;

    for (const migration of MIGRATIONS) {
      if (migration.version > currentVersion) {
        await migration.run(db);
        await db.runAsync(
          'INSERT INTO schema_version (version, applied_at) VALUES (?, datetime("now"));',
          [migration.version]
        );
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

