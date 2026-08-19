const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // 1. Enable RLS
    await client.query(`ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;`);
    console.log('Enabled RLS on subscribers table');

    // 2. Create INSERT policy
    await client.query(`
      DROP POLICY IF EXISTS "Allow public insert" ON subscribers;
      CREATE POLICY "Allow public insert" ON subscribers 
      FOR INSERT WITH CHECK (true);
    `);
    console.log('Created INSERT policy for subscribers table');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixRLS();
