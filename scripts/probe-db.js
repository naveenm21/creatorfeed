const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PASSWORD = 'CreatorFeed2026!@#';
const ENCODED_PWD = encodeURIComponent(PASSWORD);
const REF = 'xvnjqslxoqbcedtxsdgj';

const variants = [
  {
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: true
  },
  {
    host: '3.1.167.181',
    port: 6543,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  }
];

async function probe() {
  for (const config of variants) {
    console.log(`Probing Config: ${config.host} with user ${config.user}`);
    const client = new Client({ ...config, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log('✅ SUCCESS!');
      const res = await client.query('SELECT current_database(), current_user');
      console.log('Result:', res.rows[0]);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ FAILED: ${e.message}`);
    }
  }
}

probe();
