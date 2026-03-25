import { query } from './src/config/db.js';

async function migrate() {
  try {
    console.log('Starting migrations...');

    // 1. Add max_users to tenants
    await query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
    `);
    console.log('Added max_users column to tenants.');

    // 2. Create support_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created support_requests table.');

    // 3. Update existing super admin if needed
    // Assuming we might need to set role explicitly
    await query(`
      UPDATE users SET role = 'superadmin' WHERE is_super_admin = TRUE AND (role = 'user' OR role = 'admin');
    `);
    console.log('Updated super admin roles.');

    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
