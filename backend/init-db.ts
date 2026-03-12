import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying schema...');
    // Split schema into individual statements to avoid issues with multi-statement strings in some drivers
    // though pg usually handles it fine, let's just run it.
    await query(schema);
    console.log('Schema applied successfully!');

    // Verify tables
    const tables = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables created:', tables.rows.map(r => r.tablename));

    process.exit(0);
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

initDb();
