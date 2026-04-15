import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'idea_attachments'");
    if (res.rows.length > 0) {
      console.log('✅ TABLE_EXISTS: idea_attachments');
    } else {
      console.log('❌ TABLE_MISSING: idea_attachments');
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

check();
