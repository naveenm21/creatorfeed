const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const REF = 'xvnjqslxoqbcedtxsdgj';
  const PASSWORD = 'CreatorFeed2026!@#';

  const client = new Client({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('Connected to database. Applying security policies...');

    // Ensure we are in the public schema specifically
    await client.query('SET search_path TO public;');

    // SQL to enable RLS and set policies
    const sql = `
      -- 1. Enable RLS on all tables
      ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE intake_questions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE human_replies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;

      -- DROP existing policies to avoid conflicts if re-running
      DO $$ 
      DECLARE 
        pol record;
      BEGIN
        FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
        END LOOP;
      END $$;

      -- 2. Threads Policies
      CREATE POLICY "Published threads are viewable by everyone" 
        ON threads FOR SELECT USING (status = 'published');

      CREATE POLICY "Users can view their own threads" 
        ON threads FOR SELECT USING (auth.uid() = user_id);

      -- TEMPORARY: Allow anonymous insert for intake (until we switch to Service Role or Auth)
      CREATE POLICY "Allow anonymous thread creation" 
        ON threads FOR INSERT WITH CHECK (true);

      -- 3. Intake Questions
      CREATE POLICY "Intake questions are viewable by everyone" 
        ON intake_questions FOR SELECT USING (true);
      
      CREATE POLICY "Allow anonymous question update" 
        ON intake_questions FOR UPDATE USING (true);

      -- 4. Agent Responses
      CREATE POLICY "Agent responses are viewable by everyone" 
        ON agent_responses FOR SELECT USING (true);

      -- 5. Human Replies
      CREATE POLICY "Human replies are viewable by everyone" 
        ON human_replies FOR SELECT USING (true);

      CREATE POLICY "Authenticated users can post replies" 
        ON human_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      -- 6. Verdicts
      CREATE POLICY "Verdicts are viewable by everyone" 
        ON verdicts FOR SELECT USING (true);
    `;

    await client.query(sql);
    console.log('Security policies applied successfully!');
  } catch (err) {
    console.error('Security migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
