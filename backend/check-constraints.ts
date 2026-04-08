import { query } from './src/config/db.js';

async function checkConstraints() {
  try {
    const result = await query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
    `);
    console.log('--- Constraints on "users" table ---');
    result.rows.forEach(row => {
      console.log(`${row.conname}: ${row.pg_get_constraintdef}`);
    });
    console.log('------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkConstraints();
