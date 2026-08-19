import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { ProfileContent } from './ProfileContent';

type Props = {
  params: { id: string }
};

export default async function ProfilePage({ params }: Props) {
  const { id } = params;
  const supabase = await createServerSupabaseClient();

  // Removed privacy check to make profiles public

  // 2. Fetch User Info
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, karma, badges, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  // 3. Fetch Debates Started
  const { data: startedDebates } = await supabase
    .from('threads')
    .select('id, topic, platform, created_at, status')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // 4. Fetch Recent Replies
  const { data: replies } = await supabase
    .from('human_replies')
    .select('*, thread:threads(topic, id)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-black min-h-screen">
      <ProfileContent 
        profile={profile} 
        debates={startedDebates || []} 
        replies={replies || []} 
      />
    </div>
  );
}
