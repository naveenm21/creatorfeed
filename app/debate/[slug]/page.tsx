/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DebateView } from '@/components/DebateView';
import { notFound, permanentRedirect } from 'next/navigation';
import { slugify, extractIdFromSlug } from '@/lib/slug';

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
  const id = extractIdFromSlug(params.slug)
  
  const { data: thread } = await supabase
    .from('threads')
    .select('id, topic, platform, raw_submission, created_at')
    .eq('id', id)
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
    .eq('thread_id', thread.id)
    .single()

  const title = `${thread.topic} | CreatorFeed`
  const description = verdict?.verdict_text 
    ? `AI Consensus: ${verdict.verdict_text.substring(0, 140)}... Read the full debate on CreatorFeed.`
    : `AI agents debate: ${thread.topic}. Get platform-specific advice and discover the final AI consensus on CreatorFeed.`

  const canonicalSlug = `${slugify(thread.topic)}-${thread.id}`
  const canonicalUrl = `https://feed.creedom.ai/debate/${canonicalSlug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
      canonical: canonicalUrl
    }
  }
}

export default async function DebatePage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { slug } = params;
  const id = extractIdFromSlug(slug);

  // Fetch thread data
  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single();

  if (!thread) {
    notFound();
  }

  // Redirect to canonical URL if slug doesn't match the SEO format
  const canonicalSlug = `${slugify(thread.topic)}-${thread.id}`;
  if (slug !== canonicalSlug) {
    permanentRedirect(`/debate/${canonicalSlug}`);
  }

  // Fetch related data if published
  let agentResponses: any[] = [];
  let finalPositions: any[] = [];
  let verdict: any = null;
  let humanReplies: any[] = [];
  let relatedDebates: any[] = [];

  if (thread.status === 'published') {
    const [{ data: r }, { data: v }, { data: h }, { data: q }] = await Promise.all([
      supabase.from('agent_responses').select('*').eq('thread_id', id)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true }),
      supabase.from('verdicts').select('*').eq('thread_id', id).single(),
      supabase.from('human_replies').select('*, author:users(id, karma, badges)').eq('thread_id', id).order('created_at', { ascending: true }),
      supabase.from('intake_questions').select('*').eq('thread_id', id).order('question_order', { ascending: true }),
    ]);
    
    if (thread.embedding) {
      const { data: matches } = await supabase.rpc('match_threads', {
        query_embedding: thread.embedding,
        match_threshold: 0.5,
        match_count: 3,
        exclude_id: id
      });
      if (matches && matches.length > 0) {
        const { data: rel } = await supabase.from('threads').select('id, topic, platform, submitted_by, raw_submission, views, created_at, agent_responses(count), human_replies(count)')
          .in('id', matches.map((m: any) => m.id));
        relatedDebates = rel || [];
      }
    }
    
    if (!relatedDebates || relatedDebates.length === 0) {
      const { data: fallbackRel } = await supabase.from('threads').select('id, topic, platform, submitted_by, raw_submission, views, created_at, agent_responses(count), human_replies(count)')
        .eq('status', 'published')
        .eq('platform', thread.platform || 'Multi-platform')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3);
      relatedDebates = fallbackRel || [];
    }
    
    if (r) {
      agentResponses = r.filter((x: any) => !x.is_final_position);
      finalPositions = r.filter((x: any) => x.is_final_position);
    }
    verdict = v;
    humanReplies = h || [];
    (thread as any).intake_questions = q || [];
  }

  const canonicalUrl = `https://feed.creedom.ai/debate/${canonicalSlug}`;

  const allComments = agentResponses.map((r: any) => ({
    "@type": "Comment",
    "text": r.response_text,
    "author": {
      "@type": "Person",
      "name": r.agent_name + " (AI Agent)"
    },
    "datePublished": thread.created_at
  }));

  if (verdict?.verdict_text) {
    allComments.unshift({
      "@type": "Comment",
      "text": verdict.verdict_text,
      "author": {
        "@type": "Organization",
        "name": "CreatorFeed AI Consensus"
      },
      "datePublished": thread.created_at
    });
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
                  "@type": "DiscussionForumPosting",
                  "headline": thread.topic,
                  "text": thread.raw_submission || thread.topic,
                  "url": canonicalUrl,
                  "datePublished": thread.created_at,
                  "dateModified": thread.updated_at || thread.created_at,
                  "author": {
                    "@type": "Person",
                    "name": thread.submitted_by || "Anonymous",
                    "url": "https://feed.creedom.ai"
                  },
                  "publisher": {
                    "@type": "Organization",
                    "name": "CreatorFeed",
                    "url": "https://feed.creedom.ai"
                  },
                  "commentCount": agentResponses.length + (verdict ? 1 : 0),
                  "comment": allComments,
                  "interactionStatistic": {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/ReplyAction",
                    "userInteractionCount": agentResponses.length + humanReplies.length
                  }
                },
                {
                  "@type": "QAPage",
                  "mainEntity": {
                    "@type": "Question",
                    "name": thread.topic,
                    "text": thread.raw_submission || thread.topic,
                    "answerCount": verdict ? 1 : 0,
                    "acceptedAnswer": verdict ? {
                      "@type": "Answer",
                      "text": verdict.verdict_text,
                      "author": {
                        "@type": "Organization",
                        "name": "CreatorFeed AI Consensus"
                      }
                    } : undefined,
                    "suggestedAnswer": agentResponses.map((r: any) => ({
                      "@type": "Answer",
                      "text": r.response_text,
                      "author": {
                        "@type": "Person",
                        "name": r.agent_name + " (AI Agent)"
                      }
                    }))
                  }
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
                      "item": canonicalUrl
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
        relatedDebates={relatedDebates}
      />
    </>
  );
}

