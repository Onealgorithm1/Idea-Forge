import bcrypt from 'bcryptjs';
import { query } from './src/config/db.js';

async function setup() {
  const name = "Test User";
  const email = "test@example.com";
  const password = "password123";

  try {
    console.log('Checking database status...');
    const tables = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Active tables:', tables.rows.map(r => r.tablename));

    if (tables.rows.length === 0) {
      console.error('No tables found! Please run init-db.ts first.');
      process.exit(1);
    }

    console.log(`Checking if user ${email} exists...`);
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      console.log('User already exists. Updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await query('UPDATE users SET password_hash = $1, name = $2 WHERE email = $3', [hashedPassword, name, email]);
      console.log('User updated successfully!');
    } else {
      console.log('Creating new test user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [name, email, hashedPassword, 'admin']
      );
      console.log('Test user created successfully!');
    }

    // Insert a test category if missing
    await query("INSERT INTO categories (name, slug) VALUES ('General', 'general') ON CONFLICT (name) DO NOTHING");
    const cat = await query("SELECT id FROM categories WHERE slug = 'general'");
    
    console.log('Setup complete!');
    console.log('-------------------');
    console.log('Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------');

    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();
