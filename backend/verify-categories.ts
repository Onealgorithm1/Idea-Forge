import { query } from './src/config/db.js';

async function verify() {
  try {
    const cols = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    console.log('Categories columns:');
    cols.rows.forEach((r: any) => console.log(` - ${r.column_name}: ${r.data_type}`));
    process.exit(0);
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}
verify();
