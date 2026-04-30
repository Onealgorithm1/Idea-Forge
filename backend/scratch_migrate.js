import { query } from './src/config/db.js';

async function run() {
  try {
    await query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1');
    console.log('Column added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error adding column:', err);
    process.exit(1);
  }
}

run();
