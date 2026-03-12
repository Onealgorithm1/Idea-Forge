import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyInterlinking() {
  try {
    console.log('--- Verifying Database Interlinking ---');
    
    // 1. Check Categories
    const categories = await pool.query('SELECT * FROM categories');
    console.log(`Categories found: ${categories.rows.length}`);

    // 2. Check Tags and Idea_Tags logic
    console.log('Creating a test idea with tags...');
    // Get a user and category first
    const user = await pool.query('SELECT id FROM users LIMIT 1');
    const category = await pool.query('SELECT id FROM categories LIMIT 1');
    
    if (user.rows.length === 0 || category.rows.length === 0) {
      console.log('Error: Need at least one user and one category in DB.');
      return;
    }

    const userId = user.rows[0].id;
    const catId = category.rows[0].id;

    const ideaRes = await pool.query(
      'INSERT INTO ideas (title, description, author_id, category_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Verification Idea', 'Testing interlinking', userId, catId, 'Pending']
    );
    const ideaId = ideaRes.rows[0].id;

    const tagNames = ['Verify1', 'Verify2'];
    for (const name of tagNames) {
      const tagRes = await pool.query(
        'INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [name, name.toLowerCase()]
      );
      const tagId = tagRes.rows[0].id;
      await pool.query('INSERT INTO idea_tags (idea_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ideaId, tagId]);
    }

    // 3. Verify join query
    const verifyJoin = await pool.query(`
      SELECT i.title, c.name as category, 
             (SELECT json_agg(t.name) FROM tags t JOIN idea_tags it ON t.id = it.tag_id WHERE it.idea_id = i.id) as tags
      FROM ideas i
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1
    `, [ideaId]);

    console.log('Join Result:', JSON.stringify(verifyJoin.rows[0], null, 2));

    // 4. Test Notification Trigger logic (manually checked by looking at row)
    console.log('Testing notification creation...');
    await pool.query(
      'INSERT INTO notifications (user_id, type, reference_id, message) VALUES ($1, $2, $3, $4)',
      [userId, 'vote', ideaId, 'Verification test notification']
    );
    const notif = await pool.query('SELECT * FROM notifications WHERE reference_id = $1', [ideaId]);
    console.log(`Notification created: ${notif.rows.length > 0}`);

    console.log('--- Verification Complete ---');
    
    // Cleanup
    await pool.query('DELETE FROM idea_tags WHERE idea_id = $1', [ideaId]);
    await pool.query('DELETE FROM notifications WHERE reference_id = $1', [ideaId]);
    await pool.query('DELETE FROM ideas WHERE id = $1', [ideaId]);
    
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await pool.end();
  }
}

verifyInterlinking();
