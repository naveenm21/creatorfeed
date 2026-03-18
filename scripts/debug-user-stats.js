const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '0862f533-7e07-42a8-964f-bc1c2db58ba9';

async function checkUser() {
  console.log(`Checking data for User ID: ${userId}`);

  // 1. Check user stats
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Error fetching user:', userError);
  } else {
    console.log('User Stats:', {
      full_name: user.full_name,
      karma: user.karma,
      badges: user.badges
    });
  }

  // 2. Check human_replies count
  const { count, error: countError } = await supabase
    .from('human_replies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Error counting replies:', countError);
  } else {
    console.log('Human Replies Count:', count);
  }

  // 3. Fetch some replies to see if they exist
  const { data: replies, error: repliesError } = await supabase
    .from('human_replies')
    .select('id, reply_text, created_at')
    .eq('user_id', userId)
    .limit(5);

  if (repliesError) {
    console.error('Error fetching replies:', repliesError);
  } else {
    console.log('Recent Replies:', replies);
  }

  // 4. Check if there are replies without user_id but maybe associated by name?
  if (user && user.full_name) {
    const { count: nameCount } = await supabase
      .from('human_replies')
      .select('*', { count: 'exact', head: true })
      .ilike('author_name', `%${user.full_name}%`);
    console.log(`Total replies matching name "${user.full_name}":`, nameCount);
  }
}

checkUser();
