const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT relname as table_name
      FROM pg_class
      WHERE relrowsecurity = false
        AND relnamespace = 'public'::regnamespace
        AND relkind = 'r';
    `);

    console.log('Tables without RLS enabled:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkRLS();
