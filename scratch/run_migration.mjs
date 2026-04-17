import pool from '../backend/src/config/db.js';

async function runMigration() {
  try {
    console.log('Running migration: 008_add_followed_activity_setting.sql');
    await pool.query('ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS notify_on_followed_activity BOOLEAN DEFAULT TRUE');
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
