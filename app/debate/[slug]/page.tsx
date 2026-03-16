/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DebateView } from '@/components/DebateView';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every minute

type Props = {
  params: { slug: string }
};

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data: thread } = await supabase
    .from('threads')
    .select('topic, raw_submission')
    .eq('id', params.slug)
    .single();

  if (!thread) return { title: 'Debate Not Found' };

  return {
    title: thread.topic.length > 55 ? `${thread.topic.substring(0, 52)}...` : thread.topic,
    description: thread.raw_submission.length > 150 ? `${thread.raw_submission.substring(0, 147)}...` : thread.raw_submission,
    openGraph: {
      title: thread.topic,
      description: thread.raw_submission,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: thread.topic,
      description: thread.raw_submission,
    }
  };
}

export default async function DebatePage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { slug } = params;

  // Track view asynchronously 
  supabase.rpc('increment_views', { thread_id: slug }).then(() => {});

  // Fetch thread data
  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', slug)
    .single();

  if (!thread) {
    notFound();
  }

  // Fetch related data if published
  let agentResponses: any[] = [];
  let finalPositions: any[] = [];
  let verdict: any = null;
  let humanReplies: any[] = [];

  if (thread.status === 'published') {
    const [{ data: r }, { data: v }, { data: h }] = await Promise.all([
      supabase.from('agent_responses').select('*').eq('thread_id', slug)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true }),
      supabase.from('verdicts').select('*').eq('thread_id', slug).single(),
      supabase.from('human_replies').select('*').eq('thread_id', slug).order('created_at', { ascending: true }),
    ]);
    
    if (r) {
      agentResponses = r.filter((x) => !x.is_final_position);
      finalPositions = r.filter((x) => x.is_final_position);
    }
    verdict = v;
    humanReplies = h || [];
  }

  // Construct JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `https://feed.creedom.ai/debate/${slug}`,
    headline: thread.topic,
    text: thread.raw_submission,
    author: {
      '@type': 'Person',
      name: thread.submitted_by || 'Anonymous',
    },
    datePublished: thread.created_at,
    commentCount: agentResponses.length + humanReplies.length,
    comment: [
      ...agentResponses.map(r => ({
        '@type': 'Comment',
        text: r.response_text,
        author: {
          '@type': 'Person',
          name: r.agent_name + ' (AI)'
        }
      })),
      ...humanReplies.map(r => ({
        '@type': 'Comment',
        text: r.reply_text,
        author: {
          '@type': 'Person',
          name: r.author_name || 'Anonymous'
        }
      }))
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DebateView 
        slug={slug}
        initialThread={thread}
        initialResponses={agentResponses}
        initialFinalPositions={finalPositions}
        initialVerdict={verdict}
        initialHumanReplies={humanReplies}
      />
    </>
  );
}
