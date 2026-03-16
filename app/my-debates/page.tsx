/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MyDebatesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      const { data } = await supabase
        .from('threads')
        .select(`
          id,
          topic,
          platform,
          status,
          views,
          created_at,
          agent_responses(count),
          human_replies(count)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setThreads(data || []);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  const filters = ['All', 'Debating', 'Published', 'Failed'];
  const filtered = activeFilter === 'All'
    ? threads
    : threads.filter(t => t.status === activeFilter.toLowerCase());

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brandprimary border-t-transparent rounded-full animate-spin" />
    </main>
  );

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-white tracking-[-0.02em] mb-1">My Debates</h1>
          <p className="text-secondary text-[15px]">All the creator problems you&apos;ve submitted for debate</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`h-[34px] px-4 rounded-full text-[13px] font-medium border transition-colors ${
                activeFilter === f
                  ? 'bg-brandprimarysubtle text-white border-brandprimary'
                  : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
              }`}
            >{f}</button>
          ))}
        </div>

        {/* Thread List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 px-4 border border-borderdefault rounded-2xl bg-[#0A0A0A]">
            <h2 className="text-[20px] font-semibold text-primary mb-2">
              {activeFilter === 'All' ? "You haven't submitted any problems yet" : `No ${activeFilter.toLowerCase()} debates`}
            </h2>
            {activeFilter === 'All' && (
              <>
                <p className="text-[14px] text-secondary mb-6">Get 6 AI agents to debate your creator challenge</p>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-all"
                >
                  Submit Your First Problem →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(t => {
              const platform = t.platform || 'Multi-platform';
              let badgeStyle = 'bg-[#FFFFFF15] text-[#FFFFFF]';
              if (platform === 'YouTube') badgeStyle = 'bg-[#FF000015] text-[#FF4444]';
              if (platform.includes('Instagram')) badgeStyle = 'bg-[#E1306C15] text-[#E1306C]';
              if (platform.includes('TikTok')) badgeStyle = 'bg-[#00F2FE15] text-[#00F2FE]';

              const statusConfig: Record<string, { dot: string; label: string; pulse: boolean }> = {
                debating: { dot: 'bg-yellow-400', label: 'Agents debating...', pulse: true },
                published: { dot: 'bg-green-400', label: 'Debate complete', pulse: false },
                failed: { dot: 'bg-red-400', label: 'Failed', pulse: false },
                pending: { dot: 'bg-gray-400', label: 'Queued', pulse: false },
              };
              const status = statusConfig[t.status] || statusConfig.pending;
              const agentCount = (t.agent_responses as any)?.[0]?.count || 0;
              const replyCount = (t.human_replies as any)?.[0]?.count || 0;

              return (
                <Link key={t.id} href={`/debate/${t.id}`} className="block bg-card border border-borderdefault rounded-2xl p-5 hover:border-borderhover transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>{platform}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${status.dot} ${status.pulse ? 'animate-pulse' : ''}`} />
                          <span className={`text-[12px] font-medium ${
                            t.status === 'published' ? 'text-green-400' :
                            t.status === 'debating' ? 'text-yellow-400' :
                            t.status === 'failed' ? 'text-red-400' : 'text-secondary'
                          }`}>{status.label}</span>
                        </div>
                      </div>
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-2">{t.topic}</h3>
                      <div className="flex items-center gap-4 text-[12px] text-secondary">
                        <span>{agentCount} AI responses</span>
                        <span>{replyCount} community replies</span>
                        <span>{getTimeAgo(t.created_at)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-brandprimary text-[13px] font-medium">
                      {t.status === 'debating' ? (
                        <span className="text-yellow-400 animate-pulse text-[12px]">Live →</span>
                      ) : (
                        <span>View →</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
