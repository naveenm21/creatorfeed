const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Create Subscribers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'active'
      );
    `);
    console.log('Created subscribers table');

    // 2. Enable pgvector and add embedding to threads
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('Enabled pgvector');

    // Check if column exists
    const checkCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='threads' AND column_name='embedding';
    `);

    if (checkCol.rows.length === 0) {
      await client.query(`ALTER TABLE threads ADD COLUMN embedding vector(384);`);
      console.log('Added embedding column to threads');
    }

    // 3. Create match_threads RPC function
    await client.query(`
      CREATE OR REPLACE FUNCTION match_threads (
        query_embedding vector(384),
        match_threshold float,
        match_count int,
        exclude_id uuid
      )
      RETURNS TABLE (
        id uuid,
        topic text,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          threads.id,
          threads.topic,
          1 - (threads.embedding <=> query_embedding) AS similarity
        FROM threads
        WHERE 1 - (threads.embedding <=> query_embedding) > match_threshold
          AND threads.status = 'published'
          AND threads.id != exclude_id
        ORDER BY threads.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `);
    console.log('Created match_threads RPC');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
