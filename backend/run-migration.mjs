// Run migration: node run-migration.js
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = readFileSync(path.join(__dirname, 'migrations', 'add_events_and_category_color.sql'), 'utf-8');

try {
  await pool.query(sql);
  console.log('✅ Migration completed successfully!');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
} finally {
  await pool.end();
}
