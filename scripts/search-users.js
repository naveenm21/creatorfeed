const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchUsers() {
  console.log('Searching for users named "Naveen"...');
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, karma, badges, created_at')
    .ilike('full_name', '%Naveen%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(data);
  }
}

searchUsers();
