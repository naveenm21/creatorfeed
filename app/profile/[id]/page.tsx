import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProfileContent } from './ProfileContent';

type Props = {
  params: { id: string }
};

export default async function ProfilePage({ params }: Props) {
  const { id } = params;
  const supabase = await createServerSupabaseClient();

  // 1. Check Auth & Privacy
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== id) {
    // If not logged in or viewing someone else's profile, it's private
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-black">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Private Profile</h1>
        <p className="text-secondary mb-8 max-w-sm">This profile is only visible to the owner. Start contributing to build your own reputation!</p>
        <Link href="/" className="px-6 py-2 bg-brandprimary rounded-full text-white font-bold hover:bg-brandprimaryhover transition-all">
          Go Home
        </Link>
      </main>
    );
  }

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
