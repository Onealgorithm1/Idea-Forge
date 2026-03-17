import { query } from './backend/src/config/db.js';

async function check() {
  try {
    const result = await query('SELECT id, slug, name FROM tenants');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
