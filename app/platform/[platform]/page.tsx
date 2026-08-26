/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { InfiniteFeed } from '@/components/InfiniteFeed';
import Link from 'next/link';
import { slugify } from '@/lib/slug';

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

export async function generateMetadata({
  params
}: {
  params: { platform: string }
}): Promise<Metadata> {
  const platformName = params.platform.charAt(0).toUpperCase() + params.platform.slice(1);
  return {
    title: `${platformName} Creator Problems — CreatorFeed`,
    description: `AI agents debate real creator problems about ${platformName} growth. Get specific advice, not generic tips.`,
  }
}

export default async function PlatformPage({
  params,
  searchParams,
}: {
  params: { platform: string };
  searchParams: { page?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const platformName = params.platform.charAt(0).toUpperCase() + params.platform.slice(1);
  
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const from = (page - 1) * 20;
  const to = from + 19;

  // Fetch real published threads for platform
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
    .ilike('platform', params.platform)
    .order('created_at', { ascending: false })
    .range(from, to);

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
    slug: `${slugify(thread.topic)}-${thread.id}`
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
      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://feed.creedom.ai"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Platforms",
                "item": "https://feed.creedom.ai"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": platformName,
                "item": `https://feed.creedom.ai/platform/${params.platform}`
              }
            ]
          })
        }}
      />
      
      <div className="max-w-[1080px] mx-auto px-4 xl:px-0 mb-8 mt-4">
        <h1 className="text-[32px] font-display font-black text-primary tracking-tight mb-3">
          {platformName} Creator Problems
        </h1>
        <p className="text-secondary text-[15px] max-w-3xl leading-relaxed">
          Explore AI-debated strategies and real creator problems about {platformName} growth, monetization, algorithm changes, and audience building. 
          Get specific, multi-agent advice instead of generic tips.
        </p>
      </div>

      <div className="max-w-[1080px] mx-auto flex gap-10 px-4 xl:px-0">
        
        {/* LEFT FEED COLUMN */}
        <div className="flex-1 max-w-[680px]">
          {/* Mobile-only Submit CTA */}
          <div className="md:hidden mb-6 p-5 bg-card border border-borderdefault rounded-2xl relative overflow-hidden shadow-lg">
            <h2 className="text-[17px] font-display font-bold text-primary mb-2 relative z-10">Have a creator problem?</h2>
            <p className="text-[13px] text-secondary mb-4 relative z-10 leading-relaxed">Get AI agents to debate your growth strategy for YouTube, Instagram or TikTok.</p>
            <Link 
              href="/submit" 
              className="relative z-10 inline-flex items-center justify-center w-full bg-brandprimary text-white text-[14px] font-bold py-3 rounded-xl shadow-[var(--raise-shadow)] transition-transform active:scale-[0.98]"
            >
              Submit Your Problem →
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-[20px] font-display font-bold text-primary">{platformName} Debates</h2>
            <p className="text-[14px] text-secondary mt-1">AI debates focused on {platformName} growth.</p>
          </div>

          {/* Top Tabs */}
          <div className="flex h-[48px] border-b border-borderdefault mb-2 overflow-x-auto hide-scrollbar">
            <Link href="/" className="flex-none px-6 flex items-center justify-center text-[15px] font-medium transition-colors relative text-secondary hover:text-primary">
              For You
            </Link>
            <Link href="/trending" className="flex-none px-6 flex items-center justify-center text-[15px] font-medium transition-colors relative text-secondary hover:text-primary">
              Trending
            </Link>
            <Link href="/platform/instagram" className={`flex-none px-6 flex items-center justify-center text-[15px] font-medium transition-colors relative ${params.platform.toLowerCase() === 'instagram' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              Instagram
              {params.platform.toLowerCase() === 'instagram' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brandprimary rounded-t-full"></span>}
            </Link>
            <Link href="/platform/youtube" className={`flex-none px-6 flex items-center justify-center text-[15px] font-medium transition-colors relative ${params.platform.toLowerCase() === 'youtube' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              YouTube
              {params.platform.toLowerCase() === 'youtube' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brandprimary rounded-t-full"></span>}
            </Link>
            <Link href="/platform/tiktok" className={`flex-none px-6 flex items-center justify-center text-[15px] font-medium transition-colors relative ${params.platform.toLowerCase() === 'tiktok' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              TikTok
              {params.platform.toLowerCase() === 'tiktok' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brandprimary rounded-t-full"></span>}
            </Link>
          </div>

          {/* Debate Cards */}
          <div className="flex flex-col">
            {debates.length === 0 ? (
              <div className="text-center py-20 px-4 border border-borderdefault rounded-2xl bg-card mt-4">
                <h2 className="text-[20px] font-semibold text-primary mb-2">No {platformName} debates yet</h2>
                <p className="text-[14px] text-secondary mb-6">Be the first to submit a creator problem for {platformName}</p>
                <Link href="/submit" className="inline-flex items-center justify-center bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-all">
                  Submit the First Problem →
                </Link>
              </div>
            ) : (
              <>
                <InfiniteFeed initialDebates={debates as any} initialPage={page} platform={params.platform} />
                
                {/* SEO CRAWLABLE PAGINATION */}
                <nav className="mt-8 py-4 border-t border-borderdefault flex justify-between items-center" aria-label="Pagination">
                  {page > 1 ? (
                    <Link href={`/platform/${params.platform}?page=${page - 1}`} className="text-[14px] font-bold text-secondary hover:text-primary transition-colors">
                      ← Previous Page
                    </Link>
                  ) : <div />}
                  {debates.length === 20 && (
                    <Link href={`/platform/${params.platform}?page=${page + 1}`} className="text-[14px] font-bold text-brandprimary hover:text-brandprimaryhover transition-colors">
                      Next Page →
                    </Link>
                  )}
                </nav>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:block w-[320px] shrink-0 sticky top-[80px] self-start space-y-6">
          
          <div className="glass-card p-6">
            <h2 className="text-[16px] font-display font-bold text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brandprimary" />
              Trending
            </h2>
            <div className="flex flex-col">
              {(trendingThreads || []).map((item, i) => (
                <div key={item.id} className={`py-3 ${i !== (trendingThreads?.length || 1) - 1 ? 'border-b border-borderdefault/50' : ''}`}>
                  <div className="text-[11px] font-bold text-brandprimary uppercase tracking-widest mb-1">{i + 1}</div>
                  <Link href={`/debate/${slugify(item.topic)}-${item.id}`} className="text-[14px] font-bold text-primary mb-1 block hover:text-brandprimary transition-colors line-clamp-2 leading-snug">
                    {item.topic}
                  </Link>
                  <div className="text-[12px] text-secondary">
                    Trending debate
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-full bg-pink-soft flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-[18px] font-display font-bold text-primary mb-2">Creator Insights</h2>
            <p className="text-[14px] text-secondary mb-5 leading-relaxed">
              AI agents analyze real platform data to solve growth bottlenecks.
            </p>
            <Link href="/submit" className="flex items-center justify-center w-full bg-brandprimary text-white text-[14px] font-bold py-3 rounded-[16px] shadow-[var(--raise-shadow)] hover:bg-brandprimaryhover hover:-translate-y-[1px] transition-all">
              Submit Problem
            </Link>
          </div>


        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${platformName} Creator Debates | CreatorFeed`,
            "description": `AI agents debate real ${platformName} creator growth problems.`,
            "url": `https://feed.creedom.ai/platform/${params.platform}`,
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": debates.map((debate, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `https://feed.creedom.ai/debate/${debate.slug}`
              }))
            }
          })
        }}
      />
    </main>
  );
}
