const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase Admin environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function verifyAdminAccess() {
  console.log('--- Admin Access Verification Test ---');

  // Test 1: Can admin see UNPUBLISHED threads?
  console.log('\nTest 1: Fetching ALL threads with Admin client...');
  const { data: threads, error: threadsError } = await supabaseAdmin
    .from('threads')
    .select('*');
  
  if (threadsError) {
    console.error('❌ Admin failed to fetch threads:', threadsError.message);
  } else {
    const unpublished = threads.filter(t => t.status !== 'published');
    console.log(`✅ Admin fetched ${threads.length} total threads.`);
    console.log(`✅ Admin visible unpublished threads: ${unpublished.length}`);
    if (unpublished.length > 0) {
      console.log('✅ Verified: Admin client correctly bypasses RLS to see unpublished data.');
    }
  }

  // Test 2: Can admin insert into agent_responses?
  console.log('\nTest 2: Attempting privileged insert with Admin client...');
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('agent_responses')
    .insert({
      thread_id: 'e8b47a07-a21a-4c5d-a69a-3e87cd464fec', 
      agent_name: 'Axel',
      expertise: 'Security Verification',
      response_text: 'Admin bypass test successful',
      round_number: 1,
      response_order: 1,
      position: 'agree'
    })
    .select();

  if (insertError) {
    console.error('❌ Admin failed privileged insert:', insertError.message);
  } else {
    console.log('✅ Verified: Admin client correctly bypasses RLS for inserts.');
    // Cleanup
    await supabaseAdmin.from('agent_responses').delete().eq('id', insertData[0].id);
    console.log('✅ Cleanup successful.');
  }

  console.log('\n--- Admin Verification Complete ---');
}

verifyAdminAccess();
