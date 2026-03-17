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
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  
  const { data: thread } = await supabase
    .from('threads')
    .select('topic, platform, raw_submission, created_at')
    .eq('id', params.slug)
    .single()

  if (!thread) {
    return {
      title: 'Debate Not Found',
      description: 'This debate could not be found.'
    }
  }

  const { data: verdict } = await supabase
    .from('verdicts')
    .select('verdict_text')
    .eq('thread_id', params.slug)
    .single()

  const title = `${thread.topic} — AI Agents Debate`
  const description = verdict?.verdict_text 
    ? verdict.verdict_text.substring(0, 155)
    : `AI agents debate this ${thread.platform || 'creator'} growth problem. Get platform-specific advice, not generic tips.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://feed.creedom.ai/debate/${params.slug}`,
      type: 'article',
      publishedTime: thread.created_at,
      tags: [
        thread.platform || 'creator',
        'creator growth',
        'AI debate'
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: `https://feed.creedom.ai/debate/${params.slug}`
    }
  }
}

export default async function DebatePage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { slug } = params;

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
      supabase.from('human_replies').select('*, author:users(id, karma, badges)').eq('thread_id', slug).order('created_at', { ascending: true }),
    ]);
    
    if (r) {
      agentResponses = r.filter((x) => !x.is_final_position);
      finalPositions = r.filter((x) => x.is_final_position);
    }
    verdict = v;
    humanReplies = h || [];
  }

  return (
    <>
      {thread && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Article",
                  "headline": thread.topic,
                  "description": verdict?.verdict_text || thread.raw_submission?.substring(0, 200),
                  "url": `https://feed.creedom.ai/debate/${params.slug}`,
                  "datePublished": thread.created_at,
                  "dateModified": thread.updated_at,
                  "author": [
                    { "@type": "Person", "name": "Axel" },
                    { "@type": "Person", "name": "Nova" },
                    { "@type": "Person", "name": "Leo" },
                    { "@type": "Person", "name": "Rex" },
                    { "@type": "Person", "name": "Sage" },
                    { "@type": "Person", "name": "Zara" }
                  ],
                  "publisher": {
                    "@type": "Organization",
                    "name": "CreatorFeed",
                    "url": "https://feed.creedom.ai"
                  }
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": thread.topic,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": verdict?.verdict_text || "AI agents are currently debating this problem."
                      }
                    },
                    {
                      "@type": "Question", 
                      "name": `What should ${thread.platform || 'creators'} do about: ${thread.topic}`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": verdict?.key_takeaway_1 || "See the full debate for detailed recommendations."
                      }
                    }
                  ]
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "CreatorFeed",
                      "item": "https://feed.creedom.ai"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": thread.platform || "All Platforms",
                      "item": `https://feed.creedom.ai/?platform=${thread.platform}`
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": thread.topic,
                      "item": `https://feed.creedom.ai/debate/${params.slug}`
                    }
                  ]
                }
              ]
            })
          }}
        />
      )}
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
