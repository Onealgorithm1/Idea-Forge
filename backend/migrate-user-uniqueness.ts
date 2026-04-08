import { query } from './src/config/db.js';

async function migrate() {
  try {
    console.log('Starting migration: User Uniqueness');

    // 1. Identify constraint names
    const constraintsResult = await query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
      AND contype = 'u'
    `);
    
    const constraints = constraintsResult.rows.map(r => r.conname);
    console.log('Current unique constraints:', constraints);

    // 2. Drop global email uniqueness if it exists
    // Common names are users_email_key or from the schema definition
    if (constraints.includes('users_email_key')) {
      console.log('Dropping global email uniqueness (users_email_key)...');
      await query('ALTER TABLE users DROP CONSTRAINT users_email_key');
    }

    // 3. Ensure composite unique constraint exists
    if (!constraints.includes('users_email_tenant_id_key')) {
      console.log('Adding per-tenant email uniqueness (email, tenant_id)...');
      await query('ALTER TABLE users ADD CONSTRAINT users_email_tenant_id_key UNIQUE (email, tenant_id)');
    } else {
      console.log('Per-tenant email uniqueness already exists.');
    }

    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
