/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from 'next';
import { getSessionUser } from '@/auth';
import { queryOne } from '@/lib/db';
import { getVisibleThread, getDebateDetails, getRelatedDebates } from '@/lib/queries';
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
  const id = extractIdFromSlug(params.slug)

  // Metadata is public: only published threads
  const thread = await getVisibleThread(id, null)

  if (!thread) {
    return {
      title: 'Debate Not Found',
      description: 'This debate could not be found.'
    }
  }

  const verdict = await queryOne<{ verdict_text: string }>(
    `SELECT verdict_text FROM verdicts WHERE thread_id = $1`,
    [thread.id]
  )

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
  const { slug } = params;
  const id = extractIdFromSlug(slug);

  // Fetch thread data (published, or the viewer's own unpublished thread)
  const viewer = await getSessionUser();
  const thread = await getVisibleThread(id, viewer?.id ?? null);

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
    const [details, related] = await Promise.all([
      getDebateDetails(thread.id),
      getRelatedDebates(thread.id, thread.platform),
    ]);
    agentResponses = details.agentResponses;
    finalPositions = details.finalPositions;
    verdict = details.verdict;
    humanReplies = details.humanReplies;
    (thread as any).intake_questions = details.intakeQuestions;
    relatedDebates = related;
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

