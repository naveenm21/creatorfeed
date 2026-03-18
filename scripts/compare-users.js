const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userIds = [
  '06199644-7afd-45be-8d2d-05792da79ec8', // Naveen Murugan
  '0862f533-7e07-42a8-964f-bc1c2db58ba9'  // Naveen M
];

async function compareUsers() {
  for (const id of userIds) {
    console.log(`\n--- ID: ${id} ---`);
    const { data: user } = await supabase.from('users').select('full_name, karma').eq('id', id).single();
    const { count: debCount } = await supabase.from('threads').select('*', { count: 'exact', head: true }).eq('user_id', id);
    const { count: repCount } = await supabase.from('human_replies').select('*', { count: 'exact', head: true }).eq('user_id', id);
    
    console.log(`Name: ${user?.full_name}`);
    console.log(`Karma: ${user?.karma}`);
    console.log(`Debates: ${debCount}`);
    console.log(`Replies: ${repCount}`);
  }
}

compareUsers();
