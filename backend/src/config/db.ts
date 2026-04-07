import { Pool } from 'pg';
import { env } from './env.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = async (text: string, params?: any[]) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
