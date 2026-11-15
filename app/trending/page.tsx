/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { listPublishedThreads } from '@/lib/queries';
import { TrendingView } from '@/components/TrendingView';

export const metadata: Metadata = {
  title: 'Trending Creator Debates',
  description: 'The most viewed creator growth problems being debated by AI agents right now. YouTube, Instagram, TikTok strategy.',
  openGraph: {
    title: 'Trending Creator Debates — CreatorFeed',
    description: 'The most viewed creator growth debates happening right now.',
    url: 'https://feed.creedom.ai/trending'
  }
}

// Next.js 14 requires revalidation approach to balance SEO and freshness
export const revalidate = 60; // Revalidate every minute

export default async function TrendingPage() {
  const threads = await listPublishedThreads({ orderBy: 'views', limit: 50 });

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <TrendingView initialThreads={threads || []} />
    </main>
  );
}
