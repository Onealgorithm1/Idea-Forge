import pool from './backend/src/config/db.js';

async function checkUsers() {
  try {
    const res = await pool.query('SELECT id, name, email FROM users LIMIT 10');
    console.log('Users found:', res.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
