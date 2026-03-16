import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function updateSuperAdminRoles() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users SET role = 'super_admin' WHERE is_super_admin = TRUE RETURNING id, name, email, role"
    );
    console.log(`✅ Updated ${result.rowCount} super admin(s) to role 'super_admin':`);
    result.rows.forEach(u => console.log(`   - ${u.name} (${u.email}) → ${u.role}`));
  } finally {
    client.release();
    await pool.end();
  }
}

updateSuperAdminRoles().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
