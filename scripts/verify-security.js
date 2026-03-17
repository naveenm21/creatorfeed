const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLS() {
  console.log('--- RLS Verification Test ---');

  // Test 1: Fetching threads without a session
  console.log('\nTest 1: Fetching threads anonymously...');
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('*');
  
  if (threadsError) {
    if (threadsError.code === '42501') {
       console.log('✅ RLS blocked access (Expected if no select policy exists for anon)');
    } else {
       console.error('❌ Failed to fetch threads:', threadsError.message);
    }
  } else {
    console.log(`✅ Successfully fetched ${threads.length} threads.`);
    const unpublished = threads.filter(t => t.status !== 'published');
    if (unpublished.length > 0) {
      console.error(`❌ Security Violation: Found ${unpublished.length} unpublished threads!`);
    } else {
      console.log('✅ Verified: Only published threads are visible.');
    }
  }

  // Test 2: Attempting unauthorized insert into human_replies
  console.log('\nTest 2: Attempting unauthorized insert into human_replies...');
  const { error: insertError } = await supabase
    .from('human_replies')
    .insert({
      reply_text: 'Unauthorized test reply',
      thread_id: 'db74384b-0130-466d-9654-e6992d9e6027', // Use a real ID or just a valid UUID
      author_name: 'Attacker'
    });

  if (insertError) {
    console.log('✅ Correctly blocked unauthorized insert:', insertError.message);
    if (insertError.code === '42501') {
       console.log('✅ Verified: RLS Permission Denied (42501)');
    }
  } else {
    console.error('❌ Security Violation: Unauthorized insert into human_replies allowed!');
  }

  console.log('\n--- Verification Complete ---');
}

verifyRLS();
