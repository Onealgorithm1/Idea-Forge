import { query } from '../src/config/db';

async function promoteUser(email: string) {
  try {
    console.log(`Searching for user with email: ${email}...`);
    const result = await query('SELECT id, name, role, email FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`Found user: ${user.name} (Current Role: ${user.role})`);

    console.log(`Promoting to tenant_admin...`);
    await query('UPDATE users SET role = $1 WHERE id = $2', ['tenant_admin', user.id]);
    
    console.log(`Success! ${user.name} is now a tenant_admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Promotion failed:', error);
    process.exit(1);
  }
}

const targetEmail = 'arif@onealgo.com';
promoteUser(targetEmail);
