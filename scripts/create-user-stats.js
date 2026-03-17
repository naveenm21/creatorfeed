const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Create user_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        karma INTEGER DEFAULT 0,
        badges TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Enable RLS
      ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

      -- Policies
      CREATE POLICY "Users can view their own stats" 
        ON user_stats FOR SELECT 
        USING (auth.uid() = user_id);

      CREATE POLICY "Service role can do everything" 
        ON user_stats FOR ALL 
        USING (true) 
        WITH CHECK (true);
    `);
    
    console.log('SUCCESS: Created user_stats table and policies.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
