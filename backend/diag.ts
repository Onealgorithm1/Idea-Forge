import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Checking votes table indices...');
    const indexRes = await pool.query(`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relname = 'votes'
      ORDER BY
          t.relname,
          i.relname;
    `);
    console.log('Indices:', indexRes.rows);

    console.log('Checking votes table columns...');
    const columnRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'votes'");
    console.log('Columns:', columnRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
