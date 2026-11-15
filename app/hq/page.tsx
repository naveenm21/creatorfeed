import { redirect } from 'next/navigation';
import { getSessionUser } from '@/auth';
import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0; // Don't cache admin page

export default async function AdminDashboard() {
  // Defense in depth: the layout already checks, but this page reads private data
  // (emails) with full DB access now that RLS is gone, so verify admin here too.
  const user = await getSessionUser();
  const me = user ? await queryOne<{ is_admin: boolean }>(`SELECT is_admin FROM users WHERE id = $1`, [user.id]) : null;
  if (!me?.is_admin) redirect('/');

  // 1. Fetch Metrics
  const [counts, recentSubscribers, recentDebates, topUsers] = await Promise.all([
    queryOne<{ users: number; subscribers: number; threads: number }>(
      `SELECT (SELECT count(*)::int FROM users) AS users,
              (SELECT count(*)::int FROM subscribers) AS subscribers,
              (SELECT count(*)::int FROM threads) AS threads`
    ),
    query<{ email: string; created_at: string; status: string }>(
      `SELECT email, created_at, status FROM subscribers ORDER BY created_at DESC LIMIT 10`
    ),
    query<{ id: string; topic: string; status: string; platform: string; source_url: string; created_at: string }>(
      `SELECT id, topic, status, platform, source_url, created_at FROM threads ORDER BY created_at DESC LIMIT 10`
    ),
    query<{ id: string; full_name: string; email: string; karma: number }>(
      `SELECT id, full_name, email, karma FROM users ORDER BY karma DESC NULLS LAST LIMIT 10`
    ),
  ]);
  const totalUsers = counts?.users ?? 0;
  const totalSubscribers = counts?.subscribers ?? 0;
  const totalDebates = counts?.threads ?? 0;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border border-borderdefault rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Total Users</h3>
          <p className="text-4xl font-display font-black text-primary">{totalUsers || 0}</p>
        </div>
        <div className="bg-background border border-borderdefault rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Subscribers</h3>
          <p className="text-4xl font-display font-black text-primary">{totalSubscribers || 0}</p>
        </div>
        <div className="bg-background border border-borderdefault rounded-xl p-6">
          <h3 className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Debates Started</h3>
          <p className="text-4xl font-display font-black text-primary">{totalDebates || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Debates */}
        <div className="bg-card border border-borderdefault rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-borderdefault bg-background">
            <h2 className="text-primary font-bold text-lg">Recent Debates</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F] max-h-[400px] overflow-y-auto custom-scrollbar">
            {recentDebates?.map(debate => (
              <div key={debate.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-start">
                  <Link href={`/debate/${debate.id}`} className="block flex-1">
                    <p className="text-primary font-medium text-sm line-clamp-1 mb-1">{debate.topic}</p>
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
                  {debate.source_url && (
                    <a 
                      href={debate.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-brandprimary hover:underline px-2 py-1 bg-brandprimary/10 rounded ml-2"
                    >
                      Source
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-card border border-borderdefault rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-borderdefault bg-background">
            <h2 className="text-primary font-bold text-lg">Top Creators</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F] max-h-[400px] overflow-y-auto custom-scrollbar">
            {topUsers?.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex flex-col">
                  <span className="text-primary font-bold text-sm">{u.full_name || 'Anonymous'}</span>
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
        <div className="bg-card border border-borderdefault rounded-2xl overflow-hidden shadow-2xl lg:col-span-2">
          <div className="px-6 py-4 border-b border-borderdefault bg-background">
            <h2 className="text-primary font-bold text-lg">Recent Newsletter Subscribers</h2>
          </div>
          <div className="divide-y divide-[#1F1F1F]">
            {recentSubscribers?.length === 0 && (
              <div className="p-8 text-center text-secondary">No subscribers yet</div>
            )}
            {recentSubscribers?.map(sub => (
              <div key={sub.email} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="text-primary font-medium">{sub.email}</span>
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
