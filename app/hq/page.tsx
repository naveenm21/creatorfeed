import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';

export const revalidate = 0; // Don't cache admin page

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch Metrics
  const [
    { count: totalUsers },
    { count: totalSubscribers },
    { count: totalDebates },
    { data: recentSubscribers },
    { data: recentDebates },
    { data: topUsers }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('threads').select('*', { count: 'exact', head: true }),
    supabase.from('subscribers').select('email, created_at, status').order('created_at', { ascending: false }).limit(10),
    supabase.from('threads').select('id, topic, status, platform, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('users').select('id, full_name, email, karma').order('karma', { ascending: false }).limit(10)
  ]);

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Total Users</h3>
          <p className="text-4xl font-black text-white">{totalUsers || 0}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Subscribers</h3>
          <p className="text-4xl font-black text-white">{totalSubscribers || 0}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Debates Started</h3>
          <p className="text-4xl font-black text-white">{totalDebates || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Debates */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#111111]">
            <h2 className="text-white font-bold text-lg">Recent Debates</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F] max-h-[400px] overflow-y-auto custom-scrollbar">
            {recentDebates?.map(debate => (
              <div key={debate.id} className="p-4 hover:bg-white/5 transition-colors">
                <Link href={`/debate/${debate.id}`} className="block">
                  <p className="text-white font-medium text-sm line-clamp-1 mb-1">{debate.topic}</p>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className={
                      "px-2 py-0.5 rounded-full font-bold uppercase " +
                      (debate.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400')
                    }>
                      {debate.status}
                    </span>
                    <span>•</span>
                    <span>{debate.platform || 'Multi-platform'}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#111111]">
            <h2 className="text-white font-bold text-lg">Top Creators</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F] max-h-[400px] overflow-y-auto custom-scrollbar">
            {topUsers?.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{u.full_name || 'Anonymous'}</span>
                  <span className="text-secondary text-xs truncate max-w-[200px]">{u.email}</span>
                </div>
                <div className="text-brandprimary font-bold bg-brandprimary/10 px-2 py-1 rounded text-sm">
                  {u.karma} Karma
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl lg:col-span-2">
          <div className="px-6 py-4 border-b border-[#1F1F1F] bg-[#111111]">
            <h2 className="text-white font-bold text-lg">Recent Newsletter Subscribers</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F]">
            {recentSubscribers?.length === 0 && (
              <div className="p-8 text-center text-secondary">No subscribers yet</div>
            )}
            {recentSubscribers?.map(sub => (
              <div key={sub.email} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="text-white font-medium">{sub.email}</span>
                <div className="flex items-center gap-4">
                  <span className="text-secondary text-sm">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400">
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
