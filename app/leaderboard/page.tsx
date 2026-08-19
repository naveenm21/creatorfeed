import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Creators Leaderboard',
  description: 'See the top contributors answering real creator growth problems on CreatorFeed.',
};

export const revalidate = 3600; // Cache for 1 hour

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, karma, badges, avatar_url')
    .order('karma', { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen pt-12 pb-20 fade-in">
      <div className="max-w-[720px] mx-auto px-4 xl:px-0">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Creator Leaderboard</h1>
          <p className="text-secondary text-lg">Top contributors earning Karma by solving real creator problems.</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center px-6 py-4 border-b border-[#1F1F1F] bg-[#111111]">
            <div className="w-12 text-secondary text-sm font-bold uppercase tracking-wider">Rank</div>
            <div className="flex-1 text-secondary text-sm font-bold uppercase tracking-wider">Creator</div>
            <div className="w-24 text-right text-secondary text-sm font-bold uppercase tracking-wider">Karma</div>
          </div>
          
          <div className="divide-y divide-[#1F1F1F]">
            {(users || []).map((user, idx) => (
              <Link 
                key={user.id} 
                href={`/profile/${user.id}`}
                className="flex items-center px-6 py-4 hover:bg-white/5 transition-colors group"
              >
                <div className="w-12 text-lg font-bold text-tertiary group-hover:text-white transition-colors">
                  #{idx + 1}
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brandprimary/20 flex items-center justify-center text-brandprimary font-bold overflow-hidden relative">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.full_name || 'Creator'} fill className="object-cover" sizes="40px" />
                    ) : (
                      (user.full_name || 'Anonymous').charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="text-white font-bold text-base flex items-center gap-2">
                      {user.full_name || 'Anonymous Creator'}
                      {idx === 0 && <span className="text-yellow-400">👑</span>}
                      {idx === 1 && <span className="text-gray-400">🥈</span>}
                      {idx === 2 && <span className="text-amber-600">🥉</span>}
                    </div>
                    {user.badges && user.badges.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {user.badges.map((badge: string) => (
                          <span key={badge} className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-secondary">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="inline-flex items-center gap-1.5 bg-brandprimary/10 text-brandprimary px-3 py-1 rounded-full font-bold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {user.karma || 0}
                  </div>
                </div>
              </Link>
            ))}
            
            {(!users || users.length === 0) && (
              <div className="py-12 text-center text-secondary">
                No users found. Be the first to earn Karma!
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
