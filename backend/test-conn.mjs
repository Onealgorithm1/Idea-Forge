import pg from 'pg';

const url = 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require';

const pool = new pg.Pool({ connectionString: url });

pool.query('SELECT NOW()')
  .then(res => {
    console.log('SUCCESS! Database connected. Current time:', res.rows[0].now);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR connected to database:');
    console.error(err);
    process.exit(1);
  });
