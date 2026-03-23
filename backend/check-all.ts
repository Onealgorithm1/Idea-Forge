import pool, { query } from './src/config/db.js';

async function checkTenants() {
  try {
    const tenants = await query('SELECT * FROM tenants');
    console.log('Tenants:', tenants.rows);
    
    const tables = ['categories', 'ideas', 'tags', 'comments', 'votes', 'bookmarks', 'notifications'];
    for (const table of tables) {
      const cols = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.log(`Table ${table} columns:`, cols.rows.map(r => r.column_name));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkTenants();
