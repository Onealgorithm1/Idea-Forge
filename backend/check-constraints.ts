import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT 
        conname, 
        pg_get_constraintdef(oid) as def 
      FROM pg_constraint 
      WHERE conrelid = 'votes'::regclass 
      AND contype = 'u'
    `);
    console.log('Unique Constraints:', JSON.stringify(res.rows, null, 2));
    
    const pkRes = await pool.query(`
      SELECT 
        conname, 
        pg_get_constraintdef(oid) as def 
      FROM pg_constraint 
      WHERE conrelid = 'votes'::regclass 
      AND contype = 'p'
    `);
    console.log('Primary Key:', JSON.stringify(pkRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
