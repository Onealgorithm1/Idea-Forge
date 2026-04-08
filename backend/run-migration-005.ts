import { query } from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'src/migrations/005_sub_comments.sql'), 'utf8');
  console.log('Running migration...');
  try {
    await query(sql);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
