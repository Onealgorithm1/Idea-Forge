import pool from '../backend/src/config/db.ts';

async function runMigration() {
  try {
    console.log('Running robust migration for notification_settings...');
    
    // Create table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        email_enabled BOOLEAN DEFAULT TRUE,
        push_enabled BOOLEAN DEFAULT TRUE,
        notify_on_vote BOOLEAN DEFAULT TRUE,
        notify_on_comment BOOLEAN DEFAULT TRUE,
        notify_on_status_change BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table notification_settings ensures.');

    // Add new column
    await pool.query('ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS notify_on_followed_activity BOOLEAN DEFAULT TRUE');
    console.log('  ✅ Column notify_on_followed_activity ensured.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
