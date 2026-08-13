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

  const title = `${thread.topic} — ${thread.platform ? `${thread.platform} Growth Advice` : 'Creator Growth Advice'} | CreatorFeed`
  const description = verdict?.verdict_text 
    ? verdict.verdict_text.substring(0, 155)
    : `AI agents debate this ${thread.platform || 'creator'} growth problem. Get platform-specific advice, not generic tips.`

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
    const [{ data: r }, { data: v }, { data: h }, { data: q }, { data: rel }] = await Promise.all([
      supabase.from('agent_responses').select('*').eq('thread_id', id)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true }),
      supabase.from('verdicts').select('*').eq('thread_id', id).single(),
      supabase.from('human_replies').select('*, author:users(id, karma, badges)').eq('thread_id', id).order('created_at', { ascending: true }),
      supabase.from('intake_questions').select('*').eq('thread_id', id).order('question_order', { ascending: true }),
      supabase.from('threads').select('id, topic, platform, submitted_by, raw_submission, views, created_at, agent_responses(count), human_replies(count)')
        .eq('status', 'published')
        .eq('platform', thread.platform || 'Multi-platform')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3)
    ]);
    
    if (r) {
      agentResponses = r.filter((x) => !x.is_final_position);
      finalPositions = r.filter((x) => x.is_final_position);
    }
    verdict = v;
    humanReplies = h || [];
    (thread as any).intake_questions = q || [];
    relatedDebates = rel || [];
  }

  const canonicalUrl = `https://feed.creedom.ai/debate/${canonicalSlug}`;

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
                  "dateModified": thread.updated_at,
                  "author": {
                    "@type": "Person",
                    "name": thread.submitted_by || "Anonymous"
                  },
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

