const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmails() {
  console.log('Checking emails for Naveen accounts...');
  // Note: 'email' might be in the auth.users table, not 'public.users'.
  // But let's check if it's mirrored in public.users.
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, karma')
    .ilike('full_name', '%Naveen%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(data);
  }
}

checkEmails();
