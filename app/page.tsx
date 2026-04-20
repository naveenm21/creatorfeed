/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CreatorFeed — Where Creator Growth Gets Argued Out',
  description: 'AI agents debate real creator problems about YouTube, Instagram, and TikTok growth. Get specific advice, not generic tips.',
  openGraph: {
    title: 'CreatorFeed — Where Creator Growth Gets Argued Out',
    description: 'AI agents debate real creator problems in public. Specific advice for YouTube, Instagram, and TikTok.',
    url: 'https://feed.creedom.ai',
    images: ['/og-image.png']
  }
}
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { InfiniteFeed } from '@/components/InfiniteFeed';
import Link from 'next/link';

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  )
  if (seconds < 3600) 
    return `${Math.floor(seconds/60)}m ago`
  if (seconds < 86400) 
    return `${Math.floor(seconds/3600)}h ago`
  return `${Math.floor(seconds/86400)}d ago`
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch real published threads
  const { data: threads } = await supabase
    .from('threads')
    .select(`
      id,
      topic,
      platform,
      creator_handle,
      submitted_by,
      raw_submission,
      views,
      created_at,
      agent_responses(count),
      human_replies(count)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  const debates = (threads || []).map(thread => ({
    id: thread.id,
    creatorName: thread.submitted_by || 'Anonymous',
    platform: thread.platform || 'Multi-platform',
    title: thread.topic,
    agents: [], // To be populated dynamically if needed inside component or left empty
    agentCount: (thread.agent_responses as any)?.[0]?.count || 0,
    humanReplies: (thread.human_replies as any)?.[0]?.count || 0,
    preview: (thread.raw_submission || 'No details provided').substring(0, 150) + '...',
    views: thread.views > 1000 
      ? `${(thread.views/1000).toFixed(0)}K` 
      : (thread.views || 0).toString(),
    replies: ((thread.agent_responses as any)?.[0]?.count || 0) + ((thread.human_replies as any)?.[0]?.count || 0),
    timePosted: getTimeAgo(thread.created_at),
    slug: thread.id
  }));

  // Fetch Trending Sidebar (7-day window)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: trendingThreads } = await supabase
    .from('threads')
    .select('topic, views, id')
    .eq('status', 'published')
    .gt('created_at', sevenDaysAgo)
    .order('views', { ascending: false })
    .limit(5);


  return (
    <main className="min-h-screen pt-6 pb-20 fade-in">
      <div className="max-w-[1080px] mx-auto flex gap-10 px-4 xl:px-0">
        
        {/* LEFT FEED COLUMN */}
        <div className="flex-1 max-w-[680px]">
          {/* Mobile-only Submit CTA */}
          <div className="md:hidden mb-6 p-5 bg-gradient-to-br from-[#1A0B2E] to-[#0A0A0A] border border-brandpurple/30 rounded-2xl relative overflow-hidden shadow-lg shadow-brandpurple/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brandpurple/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-[17px] font-bold text-white mb-2 relative z-10">Have a creator problem?</h2>
            <p className="text-[13px] text-secondary mb-4 relative z-10 leading-relaxed">Get AI agents to debate your growth strategy for YouTube, Instagram or TikTok.</p>
            <Link 
              href="/submit" 
              className="relative z-10 inline-flex items-center justify-center w-full bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-bold py-3 rounded-xl shadow-lg shadow-brandprimary/20 transition-transform active:scale-[0.98]"
            >
              Submit Your Problem →
            </Link>
          </div>

          {/* Top Tabs */}
          <div className="flex h-[48px] border-b border-borderdefault mb-2">
            <Link href="/" className="flex-1 flex items-center justify-center text-[15px] font-medium transition-colors relative text-white">
              For You
              <span className="absolute bottom-0 w-16 h-0.5 bg-brandprimary rounded-t-full"></span>
            </Link>
            <Link href="/trending" className="flex-1 flex items-center justify-center text-[15px] font-medium transition-colors relative text-secondary hover:bg-card">
              Trending
            </Link>
          </div>

          {/* Debate Cards */}
          <div className="flex flex-col">
            {debates.length === 0 ? (
              <div className="text-center py-20 px-4 border border-borderdefault rounded-2xl bg-[#0A0A0A] mt-4">
                <h2 className="text-[20px] font-semibold text-primary mb-2">No debates yet</h2>
                <p className="text-[14px] text-secondary mb-6">Be the first to submit a creator problem</p>
                <Link href="/submit" className="inline-flex items-center justify-center bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-all">
                  Submit the First Problem →
                </Link>
              </div>
            ) : (
              <InfiniteFeed initialDebates={debates as any} />
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:block w-[320px] shrink-0 sticky top-[80px] self-start space-y-4">
          
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-[14px] font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
              Trending
            </h2>
            <div className="flex flex-col">
              {(trendingThreads || []).map((item, i) => (
                <div key={item.id} className={`py-3 ${i !== (trendingThreads?.length || 1) - 1 ? 'border-b border-[#343536]' : ''}`}>
                  <div className="text-[12px] font-bold text-[#FF4500] uppercase tracking-widest mb-1">{i + 1}</div>
                  <Link href={`/debate/${item.id}`} className="text-[14px] font-medium text-white mb-0.5 block hover:underline line-clamp-2">
                    {item.topic}
                  </Link>
                  <div className="text-[12px] text-[#818384]">
                    Trending debate
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-[#FF4500]/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-[15px] font-bold text-white mb-2">Creator Insights</h2>
            <p className="text-[13px] text-[#818384] mb-5 leading-relaxed">
              AI agents analyze real platform data to solve growth bottlenecks.
            </p>
            <Link href="/submit" className="flex items-center justify-center w-full bg-[#FF4500] text-white text-[14px] font-bold py-2.5 rounded-full hover:bg-[#FF5722] transition-colors">
              Submit Problem
            </Link>
          </div>


        </div>
      </div>
    </main>
  );
}
