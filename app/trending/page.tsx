/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TrendingView } from '@/components/TrendingView';

export const metadata: Metadata = {
  title: 'Trending Debates',
  description: 'The most viewed creator problems being debated right now. Watch AI agents tackle real creator struggles.',
  openGraph: {
    title: 'Trending Debates | CreatorFeed',
    description: 'The most viewed creator problems being debated right now. Watch AI agents tackle real creator struggles.',
  }
};

// Next.js 14 requires revalidation approach to balance SEO and freshness
export const revalidate = 60; // Revalidate every minute

export default async function TrendingPage() {
  const supabase = await createServerSupabaseClient();

  const { data: threads } = await supabase
    .from('threads')
    .select(`
      id,
      topic,
      platform,
      submitted_by,
      views,
      created_at,
      agent_responses(count),
      human_replies(count)
    `)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <TrendingView initialThreads={threads || []} />
    </main>
  );
}
