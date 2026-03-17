const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debug() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // 1. Get a sample user ID from public.users
    const userRes = await client.query('SELECT id, full_name, karma, badges FROM users LIMIT 1');
    console.log('Sample User:', userRes.rows[0]);

    if (userRes.rows.length === 0) {
      console.log('No users found in public.users table!');
      return;
    }

    const testId = userRes.rows[0].id;

    // 2. Test the select query
    const statsRes = await client.query('SELECT karma, badges FROM users WHERE id = $1', [testId]);
    console.log('Stats Query Result:', statsRes.rows[0]);

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await client.end();
  }
}

debug();
