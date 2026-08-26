/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Verdict } from '@/components/Verdict';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { AGENT_COLORS, AGENT_EXPERTISE, AGENT_AVATARS, AgentName } from '@/lib/agents';
import Link from 'next/link';
import { slugify } from '@/lib/slug';
import { DebateCard } from '@/components/DebateCard';
import { ShareDialog } from '@/components/ShareDialog';
import { ConflictHeatmap } from '@/components/ConflictHeatmap';

type AgentResponse = {
  id: string;
  agent_name: string;
  round_number: number;
  response_order: number;
  response_text: string;
  position: string | null;
  is_final_position: boolean;
};

type HumanReply = {
  id: string;
  user_id: string;
  author_name: string;
  reply_text: string;
  sentiment: string | null;
  agent_referenced: string | null;
  created_at: string;
  author?: {
    karma: number;
    badges: string[];
  };
};

const ALL_AGENTS = ['Axel', 'Nova', 'Leo', 'Rex', 'Sage', 'Zara'];

const linkifyText = (text: string) => {
  const keywordLinks = [
    { word: 'youtube', link: '/platform/youtube' },
    { word: 'tiktok', link: '/platform/tiktok' },
    { word: 'instagram', link: '/platform/instagram' },
    { word: 'algorithm', link: '/trending?q=algorithm' },
    { word: 'shadowban', link: '/trending?q=shadowban' },
    { word: 'shorts', link: '/trending?q=shorts' },
    { word: 'reels', link: '/trending?q=reels' },
    { word: 'monetization', link: '/trending?q=monetization' }
  ];

  let result: React.ReactNode[] = [text];
  
  keywordLinks.forEach(({ word, link }) => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    result = result.flatMap((part, index) => {
      if (typeof part === 'string') {
        const parts = part.split(regex);
        return parts.map((p, i) => {
          if (p.toLowerCase() === word.toLowerCase()) {
            return <Link key={`${word}-${index}-${i}`} href={link} className="text-brandprimary hover:underline font-medium">{p}</Link>;
          }
          return p;
        });
      }
      return part;
    });
  });

  return result;
}

export function DebateView({ 
  slug, 
  initialThread, 
  initialResponses, 
  initialFinalPositions, 
  initialVerdict, 
  initialHumanReplies,
  relatedDebates = []
}: { 
  slug: string;
  initialThread: any;
  initialResponses: AgentResponse[];
  initialFinalPositions: AgentResponse[];
  initialVerdict: any;
  initialHumanReplies: HumanReply[];
  relatedDebates?: any[];
}) {

  const [activeTab, setActiveTab] = useState('AI Perspectives');
  const [isScannerMode, setIsScannerMode] = useState(true);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

  const [respondingTo, setRespondingTo] = useState('General');
  const [sentiment, setSentiment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<any>(initialThread);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>(initialResponses);
  const [finalPositions, setFinalPositions] = useState<AgentResponse[]>(initialFinalPositions);
  const [verdict, setVerdict] = useState<any>(initialVerdict);
  const [humanReplies, setHumanReplies] = useState<HumanReply[]>(initialHumanReplies);
  
  const [liveStatus, setLiveStatus] = useState<'debating' | 'published' | 'pending' | 'failed' | null>(initialThread?.status || null);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const supabase = createClient();

  // Fetch current user for ownership checks
  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Fetch all data for a published thread
  const fetchFullDebate = async () => {
    const [{ data: r }, { data: v }, { data: h }] = await Promise.all([
      supabase.from('agent_responses').select('*').eq('thread_id', slug)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true }),
      supabase.from('verdicts').select('*').eq('thread_id', slug).single(),
      supabase.from('human_replies').select('*, author:users(id, karma, badges)').eq('thread_id', slug).order('created_at', { ascending: true }),
    ]);

    if (r) {
      setAgentResponses(r.filter((x: AgentResponse) => !x.is_final_position));
      setFinalPositions(r.filter((x: AgentResponse) => x.is_final_position));
    }
    setVerdict(v);
    setHumanReplies(h || []);
  };

  // Live polling while debating — fetch new agent_responses every 3 seconds
  useEffect(() => {
    if (!liveStatus || liveStatus === 'published' || liveStatus === 'failed') return;

    const poll = setInterval(async () => {
      // Check thread status
      const { data: statusData } = await supabase
        .from('threads')
        .select('status')
        .eq('id', slug)
        .single();

      if (statusData?.status === 'published') {
        setLiveStatus('published');
        clearInterval(poll);
        await fetchFullDebate();
        return;
      }

      // Fetch any newly posted agent responses
      const { data: r } = await supabase
        .from('agent_responses')
        .select('*')
        .eq('thread_id', slug)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true });

      if (r) {
        const nonFinal = r.filter((x: AgentResponse) => !x.is_final_position);
        const final = r.filter((x: AgentResponse) => x.is_final_position);
        setAgentResponses(nonFinal);
        setFinalPositions(final);

        // Figure out which agent is "next" (typing)
        const respondedAgents = new Set(nonFinal.map((x: AgentResponse) => x.agent_name));
        const nextAgent = ALL_AGENTS.find(a => !respondedAgents.has(a)) || null;
        setTypingAgent(nextAgent);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [liveStatus, slug]);

  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
    if (contentRef.current) {
      const y = contentRef.current.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Increment views on mount
  useEffect(() => {
    const increment = async () => {
      const { error } = await supabase.rpc('increment_views', { thread_id: slug });
      if (!error) {
        // Optimistically update the local state view count
        // setThread((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
      }
    };
    increment();
  }, []);

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this takeaway? Your 5 karma points for this contribution will be revoked.')) return;
    
    try {
      const res = await fetch(`/api/reply/${replyId}`, { method: 'DELETE' });
      if (res.ok) {
        setHumanReplies(prev => prev.filter(r => r.id !== replyId));
      } else {
        alert('Failed to delete reply');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting');
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: slug,
          agentReferenced: respondingTo === 'General' ? null : respondingTo,
          sentiment: sentiment || null,
          replyText: replyText.trim(),
          isAnonymous: isAnonymous
        }),
      });
      if (res.ok) {
        const { reply } = await res.json();
        setHumanReplies(prev => [...prev, reply]);
        setReplyText('');
        setAuthorName('');
        setSentiment('');
        setRespondingTo('General');
        setReplySuccess(true);
        setTimeout(() => setReplySuccess(false), 3000);
      }
    } finally {
      setReplySubmitting(false);
    }
  };

  const scrollToResponse = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 150;
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // Briefly highlight the response
      el.classList.add('ring-2', 'ring-brandprimary', 'border-transparent', 'rounded-xl', 'animate-pulse');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-brandprimary', 'border-transparent', 'rounded-xl', 'animate-pulse');
      }, 2000);
    }
  };

  const toggleResponseExpansion = (id: string) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedResponses(newExpanded);
  };



  // ── STATE: NOT FOUND ──
  if (!thread) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-[28px] font-bold text-primary">Debate not found</h1>
      <p className="text-secondary">This debate may have been removed or the link is incorrect.</p>
      <Link href="/" className="mt-2 text-brandprimary hover:underline font-medium">← Back to Homepage</Link>
    </main>
  );

  const platform = thread.platform || 'Platform';
  let badgeStyle = 'bg-[#FFFFFF15] text-[#FFFFFF]';
  if (platform === 'YouTube') badgeStyle = 'bg-[#FF000015] text-[#FF4444]';
  if (platform.includes('Instagram')) badgeStyle = 'bg-[#E1306C15] text-[#E1306C]';
  if (platform.includes('TikTok')) badgeStyle = 'bg-[#00F2FE15] text-[#00F2FE]';
  if (platform === 'Twitch') badgeStyle = 'bg-[#9146FF15] text-[#9146FF]';

  const isLive = liveStatus === 'debating' || liveStatus === 'pending';

  const roundsMap = agentResponses.reduce((acc, curr) => {
    if (!acc[curr.round_number]) acc[curr.round_number] = [];
    acc[curr.round_number].push(curr);
    return acc;
  }, {} as Record<number, AgentResponse[]>);
  const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);

  const uniqueAgentNames = Array.from(new Set(agentResponses.map(r => r.agent_name)));

  return (
    <main className="min-h-screen pt-10 pb-20 fade-in px-4 xl:px-0">
      <div className="max-w-[1080px] mx-auto flex flex-col lg:flex-row gap-10">

        {/* LEFT COLUMN */}
        <div className="flex-1 lg:max-w-[720px] order-1 lg:order-1 mt-8 lg:mt-0">

          {/* THREAD HEADER */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[15px] font-semibold text-primary">{thread.submitted_by || 'Anonymous'}</span>
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>{platform}</span>
              {isLive && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <h1 className="text-[28px] font-bold text-primary tracking-[-0.01em] leading-snug mb-4">{thread.topic}</h1>
            <div className="text-[13px] text-secondary flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span>{agentResponses.length} AI responses</span>
              <span>·</span>
              <span>{humanReplies.length} creator responses</span>
              {isLive && <span>· <span className="text-yellow-400">Agents still debating...</span></span>}
              <button 
                onClick={() => setShowShareDialog(true)}
                className="ml-auto lg:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-bold text-primary hover:bg-white/10 transition-all group"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current group-hover:rotate-12 transition-transform" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                Share
              </button>
            </div>

            {/* PROBLEM DESCRIPTION (Expandable) */}
            {thread?.raw_submission && (
              <div className="mt-4 p-4 border border-white/10 rounded-xl bg-white/5">
                <h2 className="sr-only">Creator Context</h2>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded bg-brandprimary/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span className="text-[12px] font-bold text-secondary uppercase tracking-widest">Problem Description</span>
                </div>
                {(() => {
                  const hasQuestions = (thread.intake_questions || []).some((q: any) => q.answer);
                  
                  return (
                    <>
                      <div className={`text-[15px] text-secondary leading-relaxed transition-all duration-300 ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                        <p className="mb-2">{thread.raw_submission}</p>
                        
                        {(thread.intake_questions || [])
                          .filter((q: any) => q.answer)
                          .map((q: any, idx: number) => (
                            <div key={idx} className="mt-4 border-t border-white/5 pt-3">
                              <p className="text-[12px] font-bold text-brandprimary uppercase tracking-tight mb-1">
                                {q.question_text}
                              </p>
                              <p className="text-primary font-medium italic">
                                &ldquo;{q.answer}&rdquo;
                              </p>
                            </div>
                          ))}
                      </div>

                      {(thread.raw_submission.length > 200 || hasQuestions) && (
                        <button 
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-3 text-[13px] font-bold text-brandprimary hover:underline flex items-center gap-1 transition-all"
                        >
                          {showFullDescription ? 'See less' : 'See more detail'}
                          <svg 
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${showFullDescription ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="w-full h-px bg-borderdefault mb-0" />



          {/* AI CONSENSUS & KEY TAKEAWAYS (SEO PRIORITY) */}
          {!isLive && verdict && (
            <div className="mt-8 mb-8 space-y-6">
              {/* Consensus Block */}
              <div className="bg-brandprimary/5 border border-brandprimary/20 rounded-2xl p-6 shadow-lg shadow-brandprimary/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brandprimary/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h2 className="text-[18px] font-bold text-brandprimary tracking-tight">AI Consensus</h2>
                </div>
                <div className="text-[16px] text-primary leading-[1.7] whitespace-pre-wrap">
                  {linkifyText(verdict.verdict_text)}
                </div>
              </div>
              
              {/* Key Takeaways Block */}
              {(verdict.key_takeaway_1 || verdict.key_takeaway_2) && (
                <div className="bg-[#0A0A0A] border border-borderdefault rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <h2 className="text-[16px] font-bold text-primary tracking-tight">Key Takeaways</h2>
                  </div>
                  <ul className="space-y-3">
                    {[verdict.key_takeaway_1, verdict.key_takeaway_2, verdict.key_takeaway_3].filter(Boolean).map((t, i) => (
                      <li key={i} className="text-[15px] text-secondary flex items-start gap-3 leading-relaxed">
                        <span className="text-brandprimary/60 mt-1 flex-shrink-0">•</span>
                        <span>{linkifyText(t)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="w-full h-px bg-borderdefault mb-0" />

          {/* STICKY TAB BAR */}
          <div className="sticky top-[56px] z-20 bg-background/80 backdrop-blur border-b border-borderdefault h-[48px] flex items-center gap-6 mb-8 px-2">
            {['AI Perspectives', 'Community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-1 py-3 text-[14px] font-bold border-b-2 transition-all duration-300 ${
                  activeTab === tab 
                ? 'border-brandprimary text-brandprimary' 
                : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                <span className="text-[14px] font-bold uppercase tracking-tight mr-2">{tab}</span>
                {tab === 'Community' && humanReplies.length > 0 && (
                  <span className="bg-pink-soft text-brandprimary text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {humanReplies.length}
                  </span>
                )}
              </button>
            ))}
          </div>


          {/* CONTENT */}
          <div ref={contentRef} className="pb-10">

            {/* TAB 1: AI PERSPECTIVES */}
            <div className={activeTab === 'AI Perspectives' ? 'block' : 'hidden'}>
              <h2 className="sr-only">AI Perspectives</h2>

              {/* Live: show agent circles at top while debating */}
              {isLive && (
                <div className="mb-8 bg-[#0A0A0A] border border-borderdefault rounded-2xl p-5">
                  <p className="text-[12px] text-secondary uppercase tracking-widest font-bold mb-4">
                    {agentResponses.length === 0 ? 'Waiting for agents to start...' : 'Agents responding...'}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {ALL_AGENTS.map(name => {
                      const color = AGENT_COLORS[name as keyof typeof AGENT_COLORS];
                      const hasResponded = agentResponses.some(r => r.agent_name === name);
                      const isTyping = typingAgent === name;
                      return (
                        <div key={name} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-sm transition-all ${
                              isTyping ? 'animate-pulse ring-2 ring-white/50 ring-offset-1 ring-offset-black' :
                              hasResponded ? 'opacity-100' : 'opacity-30'
                            }`}
                            style={{ backgroundColor: color }}
                          >{name[0]}</div>
                          <span className="text-[10px] text-secondary">{
                            isTyping ? '...' : hasResponded ? '✓' : name
                          }</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Responses */}
              {agentResponses.length === 0 && isLive ? (
                <div className="text-center py-16 text-secondary text-[15px]">
                  The debate will appear here as agents respond. This usually takes 1–3 minutes.
                </div>
              ) : (
                <>
                  <ConflictHeatmap responses={agentResponses} onNavigate={scrollToResponse} />

                  <div className="bg-card border border-borderdefault rounded-xl p-5 mb-10 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-pink-soft flex items-center justify-center">
                        <svg className="w-5 h-5 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-primary tracking-tight">Debate Scanner</h3>
                        <p className="text-[12px] text-secondary font-medium">Condensing the logic for faster scanning</p>
                      </div>
                    </div>
                    <button 
                      className={`px-4 py-2 rounded-[999px] text-[12px] font-bold transition-all transform active:scale-95 ${isScannerMode ? 'bg-brandprimary text-white shadow-[var(--raise-shadow)]' : 'bg-card text-primary border border-borderdefault hover:bg-borderhover'}`}
                    >
                      {isScannerMode ? 'Scanner ON' : 'Scanner OFF'}
                    </button>
                  </div>


                  {(() => {
                    // Pre-calculate turning points
                    const turningPointsInner = new Set<string>();
                    const lastPosMap: Record<string, string> = {};
                    agentResponses.forEach(r => {
                      if ((r.position === 'agree' || r.position === 'partial') && lastPosMap[r.agent_name] === 'disagree') {
                        turningPointsInner.add(r.id);
                      }
                      if (r.position && r.position !== 'none') lastPosMap[r.agent_name] = r.position;
                    });

                    return rounds.map((roundNum) => (
                      <div key={roundNum} className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px bg-borderdefault flex-1" />
                          <span className="text-[11px] uppercase tracking-widest font-black text-brandprimary">Round {roundNum}</span>
                          <div className="h-px bg-borderdefault flex-1" />
                        </div>
                        {roundsMap[roundNum].map((agent: AgentResponse, i: number) => {
                          const color = AGENT_COLORS[agent.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                          const expertise = AGENT_EXPERTISE[agent.agent_name as keyof typeof AGENT_EXPERTISE] || '';
                          const isExpanded = expandedResponses.has(agent.id) || !isScannerMode;
                          const isTurningPoint = turningPointsInner.has(agent.id);
                          const isFinalPosition = !isLive && rounds[rounds.length - 1] === roundNum && i === roundsMap[roundNum].length - 1;
                          
                          return (
                            <div key={agent.id} id={agent.id} className={`mb-10 animate-in fade-in slide-in-from-left-2 duration-300 ${isTurningPoint ? 'relative' : ''}`}>
                              {isFinalPosition && (
                                <div className="absolute -left-2 -top-2 z-20 flex items-center gap-1.5 bg-brandprimary text-white text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded shadow-lg">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Final Position
                                </div>
                              )}
                              {isTurningPoint && !isFinalPosition && (
                                <div className="absolute -left-2 -top-2 z-20 flex items-center gap-1.5 bg-brandprimary text-white text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded shadow-lg">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707zM14.243 5.05l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414z" /></svg>
                                  Progress
                                </div>
                              )}
                              
                              <div 
                                className={`pl-5 border-l-2 flex flex-col py-1 transition-all duration-200 ${isScannerMode && !isExpanded ? 'cursor-pointer hover:bg-card rounded-r-lg' : ''}`} 
                                style={{ borderLeftColor: color }}
                                onClick={() => isScannerMode && !isExpanded && toggleResponseExpansion(agent.id)}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center border border-borderdefault bg-card z-10 relative overflow-hidden">
                                    <Image
                                      src={AGENT_AVATARS[agent.agent_name as AgentName] || AGENT_AVATARS.Specialist} 
                                      alt={`${agent.agent_name} - AI Creator Growth Specialist`}
                                      width={36}
                                      height={36}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-bold text-primary tracking-tight leading-tight">{agent.agent_name}</span>
                                    <span className="text-[12px] text-secondary font-medium">{expertise}</span>
                                  </div>
                                  {agent.position && agent.position !== 'none' && (
                                    <div className="ml-auto">
                                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                                        agent.position === 'agree' ? 'bg-green-500 text-white border-green-500' :
                                        agent.position === 'disagree' ? 'bg-red-500 text-white border-red-500' :
                                        'bg-brandprimary text-white border-brandprimary'
                                      }`}>{agent.position}</span>
                                    </div>
                                  )}
                                </div>
                                
                                  <div className={`relative transition-all duration-300 ${!isExpanded ? 'max-h-[80px] overflow-hidden' : 'max-h-[3000px]'}`}>
                                    <div className={`text-[15px] text-primary leading-relaxed mb-4 pr-4 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                      {linkifyText(agent.response_text)}
                                    </div>
                                    {!isExpanded && (
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                                  )}
                                </div>

                                {isScannerMode && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleResponseExpansion(agent.id);
                                    }}
                                    className="text-[13px] font-bold text-brandprimary hover:underline w-fit mt-1 flex items-center gap-1.5"
                                  >
                                    {isExpanded ? 'See Less' : 'See Full Analysis'}
                                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                )}
                              </div>
                              {i !== roundsMap[roundNum].length - 1 && <div className="w-full h-px bg-borderdefault mt-8" />}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </>
              )}


              {/* "Next agent responding" indicator */}
              {isLive && typingAgent && (
                <div className="mt-4 border border-borderdefault rounded-xl p-4 bg-[#0A0A0A] flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-primary text-[13px] font-bold animate-pulse shrink-0"
                    style={{ backgroundColor: AGENT_COLORS[typingAgent as keyof typeof AGENT_COLORS] || '#888' }}
                  >{typingAgent[0]}</div>
                  <span className="text-[13px] text-secondary">
                    <span className="text-primary font-medium">{typingAgent}</span> is forming a response...
                  </span>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-brandprimary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TAB 2: COMMUNITY */}
            <div className={activeTab === 'Community' ? 'block' : 'hidden'}>
              <div className="bg-[#0A0A0A] border border-borderdefault rounded-2xl p-4 mb-8">
                {replySuccess && (
                  <div className="mb-4 text-green-400 text-[14px] font-medium bg-green-500/10 px-4 py-2 rounded-xl">
                    ✓ Your take was added!
                  </div>
                )}
                <div className="flex flex-col gap-3 mb-3">
                  {!isAnonymous ? (
                    <div className="text-[14px] text-secondary bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between">
                       <span>Posting as <span className="text-primary font-bold">{currentUserId ? 'your account' : 'Guest'}</span></span>
                       <button 
                         onClick={() => setIsAnonymous(true)}
                         className="text-[12px] text-brandprimary font-bold hover:underline"
                       >
                         Switch to Anonymous
                       </button>
                    </div>
                  ) : (
                    <div className="text-[14px] text-teal-400 bg-teal-400/5 px-4 py-2.5 rounded-xl border border-teal-400/10 flex items-center justify-between">
                       <span>Posting as <span className="font-bold uppercase tracking-tight">Anonymous</span></span>
                       <button 
                         onClick={() => setIsAnonymous(false)}
                         className="text-[12px] text-secondary font-bold hover:underline"
                       >
                         Show my name
                       </button>
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Share your experience or pushback..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full bg-[#111] border border-borderdefault rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[14px] min-h-[90px] resize-none mb-4"
                />

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  {['agree', 'disagree'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSentiment(sentiment === s ? '' : s)}
                      className={`flex-1 h-11 rounded-xl text-[14px] font-medium border transition-all flex items-center justify-center gap-2 ${
                        sentiment === s
                          ? s === 'agree' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                          : `bg-[#111] text-secondary border-borderdefault ${s === 'agree' ? 'hover:border-green-500/50 hover:text-green-400' : 'hover:border-red-500/50 hover:text-red-400'}`
                      }`}
                    >
                      {s === 'agree' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          I agree with agents
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          I don&apos;t agree with agents
                        </>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <span className="text-[12px] text-tertiary">No account needed to reply</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleReplySubmit();
                    }}
                    disabled={replySubmitting || !replyText.trim()}
                    className="bg-brandprimary text-white text-[14px] font-bold px-8 py-3 rounded-xl hover:opacity-90 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brandprimary/20"
                  >
                    {replySubmitting ? 'Posting...' : 'Post Your Take →'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {humanReplies.length === 0 ? (
                  <p className="text-center text-secondary py-8">No community replies yet. Be the first!</p>
                ) : (
                  humanReplies.map((item, i) => {
                    return (
                      <div key={item.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[15px] font-bold text-primary transition-colors">{item.author_name || 'Anonymous'}</span>
                            {item.author && item.author_name !== 'Anonymous' && (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-brandprimary bg-brandprimary/10 px-1.5 py-0.5 rounded border border-brandprimary/20">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  {item.author.karma} Karma
                                </span>
                                {item.author.badges?.map(badge => (
                                  <span key={badge} className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded border border-teal-400/20 uppercase tracking-tight">
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.sentiment === 'agreed' && <span className="text-white text-[11px] font-bold bg-green-500 px-2 py-0.5 rounded-full">Agreed</span>}
                            {item.sentiment === 'disagreed' && <span className="text-white text-[11px] font-bold bg-red-500 px-2 py-0.5 rounded-full">Disagreed</span>}
                            <span className="text-[12px] text-[#444] ml-auto">
                              {mounted ? new Date(item.created_at).toLocaleDateString() : null}
                            </span>
                            {currentUserId === item.user_id && (
                              <button 
                                onClick={() => handleDeleteReply(item.id)}
                                className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all ml-2"
                                title="Delete my comment"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-[15px] text-secondary leading-[1.6] bg-[#0A0A0A] p-4 rounded-xl border border-borderdefault">{item.reply_text}</p>
                        </div>
                        {i !== humanReplies.length - 1 && <div className="w-full h-px bg-borderdefault mt-6" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PROMOTIONAL & FINAL RECOMMENDATIONS */}
            <div className="mt-12">
              {!isLive && (
                <>



                  {finalPositions.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-[13px] uppercase tracking-widest font-bold text-secondary mb-6 pl-1">Final Recommendation</h2>
                      <div className="space-y-6">
                        {finalPositions.map(fp => {
                          const color = AGENT_COLORS[fp.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                          return (
                            <div key={fp.id} className="border-l-[3px] pl-6 py-1 transition-all" style={{ borderLeftColor: color }}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                                  <Image
                                    src={AGENT_AVATARS[fp.agent_name as AgentName] || AGENT_AVATARS.Specialist} 
                                    alt={`${fp.agent_name} - AI Creator Growth Specialist`}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-bold text-primary text-[15px]">{fp.agent_name}</span>
                              </div>
                              <p className="text-[14px] text-secondary leading-[1.7]">{fp.response_text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>

            {/* RELATED DEBATES */}
            {relatedDebates.length > 0 && (
              <div className="mt-16 pt-8 border-t border-borderdefault">
                <h3 className="text-[18px] font-bold text-primary mb-6 pl-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Related Debates
                </h3>
                <div className="space-y-4">
                  {relatedDebates.map(debate => {
                    const formattedDebate = {
                      id: debate.id,
                      creatorName: debate.submitted_by || 'Anonymous',
                      platform: debate.platform || 'Multi-platform',
                      title: debate.topic,
                      agents: [],
                      agentCount: (debate.agent_responses as any)?.[0]?.count || 0,
                      humanReplies: (debate.human_replies as any)?.[0]?.count || 0,
                      preview: (debate.raw_submission || 'No details provided').substring(0, 150) + '...',
                      views: debate.views > 1000 
                        ? `${(debate.views/1000).toFixed(0)}K` 
                        : (debate.views || 0).toString(),
                      replies: ((debate.agent_responses as any)?.[0]?.count || 0) + ((debate.human_replies as any)?.[0]?.count || 0),
                      timePosted: formatDistanceToNow(new Date(debate.created_at)) + ' ago',
                      slug: `${slugify(debate.topic)}-${debate.id}`
                    };
                    return <DebateCard key={debate.id} debate={formattedDebate} />
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-[80px] self-start order-2 lg:order-2 space-y-6">
          {/* Stats Widget */}
          <div className="sticky top-[80px]">
            <div className="glass-card p-6">
              <h3 className="text-[14px] font-display font-bold text-primary mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brandprimary" />
                Debate Stats
              </h3>
              {isLive ? (
                <div className="bg-borderdefault border border-borderhover rounded-[16px] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-[13px] font-bold text-primary uppercase tracking-widest">Live Debate</span>
                  </div>
                  <p className="text-[13px] text-secondary leading-relaxed mb-3">Agents are forming their arguments. New responses appear automatically.</p>
                  <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-brandprimary rounded-full animate-pulse" style={{ width: `${Math.min(100, (agentResponses.length / 6) * 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-tertiary mt-2">{agentResponses.length} of 6 agents responded</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* AGGRESSIVE UGC CTA (Sidebar Variant) */}
          <button 
            onClick={() => {
              handleTabSwitch('Community');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-brandprimary/50 transition-all group cursor-pointer"
          >
            <div className="flex -space-x-2 mb-1">
              <div className="w-12 h-12 rounded-full bg-brandprimary/20 border-2 border-card flex items-center justify-center text-brandprimary font-bold text-[18px]">5</div>
              <div className="w-12 h-12 rounded-full bg-teal-500/10 border-2 border-card flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
              </div>
            </div>
            <div>
              <p className="text-[16px] font-bold text-primary group-hover:text-brandprimary transition-colors">What&apos;s your take?</p>
              <p className="text-[13px] text-secondary mt-1">Earn 5 Karma for replying</p>
            </div>
            <div className="mt-2 text-[12px] font-bold text-brandprimary/80 group-hover:text-brandprimary transition-colors flex items-center gap-1">
              Join the discussion <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </button>

          {/* PROMOTIONAL SECTION: Only for Instagram-related problems */}
          {!isLive && thread.platform?.toLowerCase().includes('instagram') && (
            <div className="bg-gradient-to-br from-brandprimary/10 to-brandorange/10 border border-brandprimary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-brandprimary/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-brandprimary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <span className="text-[11px] uppercase tracking-widest font-bold text-brandprimary">Recommended</span>
              </div>
              <h3 className="text-[16px] font-bold text-primary mb-2 leading-snug">
                Struggling with {thread.topic}?
              </h3>
              <p className="text-[13px] text-secondary leading-relaxed mb-4">
                This tool helps you solve growth problems and understand your audience.
              </p>
              <Link 
                href="https://creedom.ai" 
                target="_blank"
                className="flex items-center justify-center w-full bg-brandprimary text-white text-[13px] font-bold px-4 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-brandprimary/20"
              >
                Explore Creedom.ai →
              </Link>
            </div>
          )}

          {/* HAS THIS DEBATE HELPED YOU? */}
          {!isLive && (
            <div className="glass-card p-6">
              <h3 className="text-[15px] font-bold text-primary mb-2">Has this debate helped you?</h3>
              <p className="text-[12px] text-secondary mb-4">Get 6 AI agents to debate your creator problem.</p>
              <Link href="/submit" className="flex items-center justify-center w-full bg-white/5 border border-white/10 text-primary text-[13px] font-bold px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                Submit Your Problem →
              </Link>
            </div>
          )}

          {/* Related Topics Widget */}
          <div className="glass-card p-6 mt-4">
            <h3 className="text-[14px] font-display font-bold text-primary mb-4">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {['Algorithm', 'Retention', 'Shorts', 'Hooks', 'Thumbnails'].map(tag => (
                <Link key={tag} href={`/trending?q=${tag.toLowerCase()}`} className="text-[12px] font-medium text-secondary bg-borderdefault/50 hover:bg-borderhover hover:text-primary px-3 py-1.5 rounded-full transition-colors border border-borderdefault">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
        url={currentUrl}
        title={thread.topic}
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
