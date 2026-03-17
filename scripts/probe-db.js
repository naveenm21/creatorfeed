const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PASSWORD = 'CreatorFeed2026!@#';
const ENCODED_PWD = encodeURIComponent(PASSWORD);
const REF = 'xvnjqslxoqbcedtxsdgj';

const variants = [
  // AP-SOUTH-1 (Mumbai) - Likely based on MAA headers
  `postgresql://postgres.${REF}:${ENCODED_PWD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  `postgresql://postgres:${ENCODED_PWD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  
  // AP-SOUTHEAST-1 (Singapore) - Provided by user
  `postgresql://postgres.${REF}:${ENCODED_PWD}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  `postgresql://postgres:${ENCODED_PWD}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  
  // Direct IPv4 variants (if pooler is tricky)
  `postgresql://postgres.${REF}:${ENCODED_PWD}@3.108.251.216:6543/postgres`,
  `postgresql://postgres.${REF}:${ENCODED_PWD}@3.1.167.181:6543/postgres`
];

async function probe() {
  for (const uri of variants) {
    console.log(`Probing: ${uri.replace(ENCODED_PWD, '****')}`);
    const client = new Client({ connectionString: uri, connectionTimeoutMillis: 5000 });
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
