/**
 * One-time migration: Add manager_id and tenant_id columns to the categories table.
 * Run with: npx tsx migrate-categories.ts
 */
import { query } from './src/config/db.js';

async function migrate() {
  console.log('🚀 Starting categories table migration...');

  try {
    // 1. Add tenant_id column if it doesn't exist
    await query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
    `);
    console.log('✅ [1/4] Added tenant_id column to categories');

    // 2. Add manager_id column if it doesn't exist
    await query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✅ [2/4] Added manager_id column to categories');

    // 3. Add updated_at column if it doesn't exist (needed by updateCategory controller)
    await query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ [3/4] Added updated_at column to categories');

    // 4. Add is_default column if it doesn't exist (used in frontend)
    await query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ [4/4] Added is_default column to categories');

    // 5. Verify the columns
    const cols = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Current categories table schema:');
    cols.rows.forEach((r: any) => console.log(`   - ${r.column_name}: ${r.data_type}`));

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
