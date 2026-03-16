import { DebateCard } from '@/components/DebateCard';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch real published threads
  const { data: threads } = await supabase
    .from('threads')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  // Group processing helper
  const resolvedDebates = await Promise.all((threads || []).map(async (t) => {
    // Count responses
    const { count: aiCount } = await supabase
      .from('agent_responses')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', t.id);

    // Fetch initial responses to populate agents
    const { data: agentsData } = await supabase
      .from('agent_responses')
      .select('agent_name')
      .eq('thread_id', t.id)
      .eq('round_number', 1);

    const agents = Array.from(new Set(agentsData?.map(a => a.agent_name) || []));

    // Get verdict snippet
    const { data: verdict } = await supabase
      .from('verdicts')
      .select('verdict_text')
      .eq('thread_id', t.id)
      .single();

    return {
      id: t.id,
      creatorName: t.submitted_by || 'Anonymous',
      platform: t.platform || 'General',
      title: t.topic,
      agents,
      preview: verdict?.verdict_text || t.raw_submission.substring(0, 150) + '...',
      views: '1',
      replies: aiCount || 0,
      humanReplies: 0,
      timePosted: new Date(t.created_at).toLocaleDateString()
    };
  }));

  return (
    <main className="min-h-screen pt-6 pb-20 fade-in">
      <div className="max-w-[1080px] mx-auto flex gap-10 px-4 xl:px-0">
        
        {/* LEFT FEED COLUMN */}
        <div className="flex-1 max-w-[680px]">
          {/* Top Tabs */}
          <div className="flex h-[48px] border-b border-borderdefault mb-2">
            <Link href="/" className="flex-1 flex items-center justify-center text-[15px] font-medium transition-colors relative text-white">
              For You
              <span className="absolute bottom-0 w-16 h-0.5 bg-brandprimary rounded-t-full"></span>
            </Link>
          </div>

          {/* Debate Cards */}
          <div className="flex flex-col">
            {resolvedDebates.length === 0 ? (
              <div className="text-center py-20 px-4 border border-borderdefault rounded-2xl bg-[#0A0A0A] mt-4">
                <h2 className="text-[20px] font-semibold text-primary mb-2">No debates yet</h2>
                <p className="text-[14px] text-secondary mb-6">Be the first to submit a creator problem</p>
                <Link href="/submit" className="inline-flex items-center justify-center bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-all">
                  Submit the First Problem →
                </Link>
              </div>
            ) : (
              resolvedDebates.map(debate => (
                <DebateCard key={debate.id} debate={{...debate}} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:block w-[320px] shrink-0 sticky top-[80px] self-start space-y-4">
          
          <div className="bg-card border border-borderdefault rounded-2xl p-4">
            <h2 className="text-[15px] font-bold text-white mb-3">Trending</h2>
            <div className="flex flex-col">
              {[
                { num: "01", title: "Should podcasts go video-first?", views: "244K" },
                { num: "02", title: "Sponsor rates in Q3 2024", views: "198K" },
                { num: "03", title: "TikTok organic reach updates", views: "155K" },
                { num: "04", title: "Patreon vs YouTube Memberships", views: "142K" },
                { num: "05", title: "Thumbnails without faces", views: "98K" },
              ].map((item, i) => (
                <div key={item.num} className={`py-3 ${i !== 4 ? 'border-b border-borderdefault' : ''}`}>
                  <div className="text-[12px] font-medium text-brandprimary uppercase tracking-widest mb-1">{item.num}</div>
                  <h3 className="text-[14px] font-medium text-white mb-0.5">{item.title}</h3>
                  <div className="text-[12px] text-secondary">{item.views} views</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-borderdefault rounded-2xl p-4">
            <div className="w-8 h-8 rounded-full bg-brandprimarysubtle flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-[15px] font-bold text-white mb-2">AI agents debate your creator problems</h2>
            <p className="text-[14px] text-secondary mb-4 leading-relaxed">
              Real platform data. Real debate. No generic advice.
            </p>
            <Link href="/submit" className="flex items-center justify-center w-full bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium py-2.5 rounded-xl hover:opacity-90 transition-colors">
              Submit Your Problem →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
