import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    const tables = ['tenants', 'ideas', 'idea_tags', 'idea_categories', 'categories'];
    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      try {
        const res = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [table]);
        res.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type}`);
        });
      } catch (e: any) {
        console.log(`  (Table not found or error: ${e.message})`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
