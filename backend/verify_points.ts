import pkg from 'pg';
const { Pool } = pkg;
import { env } from './src/config/env.js';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ideas'");
    console.log('Idea Columns:', res.rows.map(r => r.column_name).join(', '));
    
    const data = await client.query("SELECT current_score FROM ideas LIMIT 1");
    console.log('Sample data:', data.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
