import { query } from './src/config/db.js';

async function run() {
  try {
    const tenantSlug = 'onealgo';
    const email = 'shaikarief298@gmaill.com';

    console.log('--- Checking Tenant ---');
    const tenantRes = await query('SELECT id, slug FROM tenants WHERE slug = $1', [tenantSlug]);
    console.log('Tenant:', tenantRes.rows);

    if (tenantRes.rows.length > 0) {
      const tenantId = tenantRes.rows[0].id;
      console.log('--- Checking User in this Tenant ---');
      const userRes = await query('SELECT id, email, tenant_id, role FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
      console.log('User in Tenant:', userRes.rows);

      console.log('--- Checking User globally (any tenant) ---');
      const globalRes = await query('SELECT id, email, tenant_id FROM users WHERE email = $1', [email]);
      console.log('Global Users:', globalRes.rows);
      
      console.log('--- Checking User with similar email ---');
      const similarRes = await query('SELECT id, email, tenant_id FROM users WHERE email ILIKE $1', ['%shaikarief%']);
      console.log('Similar Users:', similarRes.rows);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
