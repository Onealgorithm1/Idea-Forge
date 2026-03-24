import { query } from './src/config/db.js';

async function diagnose() {
  try {
    console.log('--- DIAGNOSTIC START ---');
    
    // Check constraints
    const constraints = await query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE nspname = 'public' AND contype = 'f' AND conrelid = 'ideas'::regclass
    `);
    console.log('Ideas foreign keys:', constraints.rows);

    // Check recent errors in background (if possible, but we can't easily)
    // Check categories existence
    const categories = await query('SELECT id, name, tenant_id FROM categories');
    console.log('All categories:', categories.rows);

    // Check tenants
    const tenants = await query('SELECT id, name, slug FROM tenants');
    console.log('Tenants:', tenants.rows);

    // Check tags
    const tags = await query('SELECT id, name, tenant_id FROM tags');
    console.log('Tags:', tags.rows);

    console.log('--- DIAGNOSTIC END ---');
  } catch (err) {
    console.error('DIAGNOSTIC ERROR:', err);
  } finally {
    process.exit(0);
  }
}

diagnose();
