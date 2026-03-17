'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DebateCard } from '@/components/DebateCard';
import { createClient } from '@/lib/supabase';

type Debate = {
  id: string;
  creatorName: string;
  platform: string;
  title: string;
  agents: string[];
  agentCount: number;
  humanReplies: number;
  preview: string;
  views: string;
  replies: number;
  timePosted: string;
  slug: string;
};

// Helper to format time ago (same as in page.tsx)
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

export function InfiniteFeed({ initialDebates }: { initialDebates: Debate[] }) {
  const [debates, setDebates] = useState<Debate[]>(initialDebates);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchMoreDebates = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const from = page * 20;
    const to = from + 19;

    const { data: threads, error } = await supabase
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
      .range(from, to);

    if (error) {
      console.error('Error fetching more debates:', error);
      setLoading(false);
      return;
    }

    if (!threads || threads.length < 20) {
      setHasMore(false);
    }

    const newDebates = (threads || []).map(thread => ({
      id: thread.id,
      creatorName: thread.submitted_by || 'Anonymous',
      platform: thread.platform || 'Multi-platform',
      title: thread.topic,
      agents: [], // To be populated dynamically if needed
      agentCount: (thread.agent_responses as unknown as { count: number }[])?.[0]?.count || 0,
      humanReplies: (thread.human_replies as unknown as { count: number }[])?.[0]?.count || 0,
      preview: (thread.raw_submission || 'No details provided').substring(0, 150) + '...',
      views: (thread.views || 0) > 1000 
        ? `${((thread.views || 0)/1000).toFixed(0)}K` 
        : (thread.views || 0).toString(),
      replies: ((thread.agent_responses as unknown as { count: number }[])?.[0]?.count || 0) + ((thread.human_replies as unknown as { count: number }[])?.[0]?.count || 0),
      timePosted: getTimeAgo(thread.created_at),
      slug: thread.id
    }));

    setDebates(prev => [...prev, ...newDebates]);
    setPage(prev => prev + 1);
    setLoading(false);
  }, [loading, hasMore, page, supabase]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMoreDebates();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, page, hasMore, loading, fetchMoreDebates]);

  return (
    <div className="flex flex-col">
      {debates.map(debate => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
      
      {/* TRIGGER ELEMENT */}
      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-secondary text-[14px]">
            <div className="w-4 h-4 border-2 border-brandprimary/30 border-t-brandprimary rounded-full animate-spin"></div>
            Loading more debates...
          </div>
        )}
        {!hasMore && debates.length > 0 && (
          <span className="text-tertiary text-[13px] py-4">You&apos;ve reached the end of the line.</span>
        )}
      </div>
    </div>
  );
}
