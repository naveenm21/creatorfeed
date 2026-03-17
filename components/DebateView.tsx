/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Verdict } from '@/components/Verdict';
import { createClient } from '@/lib/supabase';
import { AGENT_COLORS, AGENT_EXPERTISE, AGENT_AVATARS, AgentName } from '@/lib/agents';
import Link from 'next/link';
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
  author_name: string;
  reply_text: string;
  sentiment: string | null;
  agent_referenced: string | null;
  created_at: string;
};

const ALL_AGENTS = ['Axel', 'Nova', 'Leo', 'Rex', 'Sage', 'Zara'];

export function DebateView({ 
  slug, 
  initialThread, 
  initialResponses, 
  initialFinalPositions, 
  initialVerdict, 
  initialHumanReplies 
}: { 
  slug: string;
  initialThread: any;
  initialResponses: AgentResponse[];
  initialFinalPositions: AgentResponse[];
  initialVerdict: any;
  initialHumanReplies: HumanReply[];
}) {

  const [activeTab, setActiveTab] = useState('AI Debate');
  const [respondingTo, setRespondingTo] = useState('General');
  const [sentiment, setSentiment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
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

  // Fetch all data for a published thread
  const fetchFullDebate = async () => {
    const [{ data: r }, { data: v }, { data: h }] = await Promise.all([
      supabase.from('agent_responses').select('*').eq('thread_id', slug)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true }),
      supabase.from('verdicts').select('*').eq('thread_id', slug).single(),
      supabase.from('human_replies').select('*').eq('thread_id', slug).order('created_at', { ascending: true }),
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
        setThread((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
      }
    };
    increment();
  }, []);

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
          authorName: authorName.trim() || 'Anonymous',
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
      el.classList.add('ring-2', 'ring-brandprimary', 'rounded-xl', 'animate-pulse');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-brandprimary', 'rounded-xl', 'animate-pulse');
      }, 2000);
    }
  };


  // ── STATE: NOT FOUND ──
  if (!thread) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-[28px] font-bold text-white">Debate not found</h1>
      <p className="text-secondary">This debate may have been removed or the link is incorrect.</p>
      <Link href="/" className="mt-2 text-brandprimary hover:underline font-medium">← Back to Homepage</Link>
    </main>
  );

  // ── SHARED LAYOUT (both live and published) ──
  const platform = thread.platform || 'Platform';
  let badgeStyle = 'bg-[#FFFFFF15] text-[#FFFFFF]';
  if (platform === 'YouTube') badgeStyle = 'bg-[#FF000015] text-[#FF4444]';
  if (platform.includes('Instagram')) badgeStyle = 'bg-[#E1306C15] text-[#E1306C]';
  if (platform.includes('TikTok')) badgeStyle = 'bg-[#00F2FE15] text-[#00F2FE]';

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
        <div className="flex-1 lg:max-w-[720px] order-2 lg:order-1 mt-8 lg:mt-0">

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
            <h1 className="text-[28px] font-bold text-white tracking-[-0.01em] leading-snug mb-4">{thread.topic}</h1>
            <div className="text-[13px] text-secondary flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span>{agentResponses.length} AI responses</span>
              <span>·</span>
              <span>{humanReplies.length} creator responses</span>
              <span>·</span>
              <span>{thread.views || 0} views</span>
              {isLive && <span>· <span className="text-yellow-400">Agents still debating...</span></span>}
              <button 
                onClick={() => setShowShareDialog(true)}
                className="ml-auto lg:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-bold text-white hover:bg-white/10 transition-all group"
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded bg-brandprimary/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-brandprimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span className="text-[12px] font-bold text-secondary uppercase tracking-widest">Problem Description</span>
                </div>
                <p className={`text-[15px] text-secondary leading-relaxed transition-all duration-300 ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                  {thread.raw_submission}
                </p>
                {thread.raw_submission.length > 150 && (
                  <button 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-[13px] font-bold text-brandprimary hover:underline flex items-center gap-1 transition-all"
                  >
                    {showFullDescription ? 'See less' : 'See more'}
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
              </div>
            )}
          </div>
          <div className="w-full h-px bg-[#1F1F1F] mb-0" />

          {/* STICKY TAB BAR */}
          <div className="sticky top-[56px] z-20 bg-[#000000]/80 backdrop-blur border-b border-[#1F1F1F] h-[48px] flex items-center gap-6 mb-8 px-2">
            {['AI Debate', 'Community', 'Verdict'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={`h-full flex items-center border-b-2 transition-colors duration-200 ${
                  activeTab === tab
                    ? tab === 'Community' ? 'border-teal-400 text-white' : 'border-brandprimary text-white'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                <span className="text-[14px] font-medium mr-2">{tab}</span>
                {tab === 'Community' && humanReplies.length > 0 && (
                  <span className="bg-teal-500/20 text-teal-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {humanReplies.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div ref={contentRef} className="pb-10">

            {/* TAB 1: AI DEBATE */}
            <div className={activeTab === 'AI Debate' ? 'block' : 'hidden'}>

              {/* Live: show agent circles at top while debating */}
              {isLive && (
                <div className="mb-8 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-5">
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all ${
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
                  {rounds.map((roundNum) => (
                  <div key={roundNum} className="mb-12">
                     <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-[#1F1F1F] flex-1" />
                      <span className="text-[11px] uppercase tracking-widest font-bold text-brandprimary">Round {roundNum}</span>
                      <div className="h-px bg-[#1F1F1F] flex-1" />
                    </div>
                    {roundsMap[roundNum].map((agent: AgentResponse, i: number) => {
                      const color = AGENT_COLORS[agent.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                      const expertise = AGENT_EXPERTISE[agent.agent_name as keyof typeof AGENT_EXPERTISE] || '';
                      return (
                        <div key={agent.id} id={agent.id} className="mb-6 animate-[fadeIn_0.4s_ease-out_forwards] transition-all duration-500">
                          <div className="pl-4 border-l-[3px] flex flex-col py-1" style={{ borderLeftColor: color }}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center border-2 z-10 relative overflow-hidden shrink-0" style={{ borderColor: color }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={AGENT_AVATARS[agent.agent_name as AgentName] || AGENT_AVATARS.Specialist} 
                                  alt={agent.agent_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-bold text-white leading-tight">{agent.agent_name}</span>
                                <span className="text-[13px] text-secondary">{expertise}</span>
                              </div>
                              {agent.position && agent.position !== 'none' && (
                                <div className="ml-auto">
                                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${
                                    agent.position === 'agree' ? 'bg-green-500/10 text-green-400' :
                                    agent.position === 'disagree' ? 'bg-red-500/10 text-red-400' :
                                    'bg-blue-500/10 text-blue-400'
                                  }`}>{agent.position}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[15px] text-white leading-[1.7] mb-3 pr-2">{agent.response_text}</p>
                          </div>
                          {i !== roundsMap[roundNum].length - 1 && <div className="w-full h-px bg-[#1F1F1F] mt-6" />}
                        </div>
                      );
                    })}
                  </div>
                  ))}
                </>
              )}

              {/* "Next agent responding" indicator */}
              {isLive && typingAgent && (
                <div className="mt-4 border border-[#1F1F1F] rounded-xl p-4 bg-[#0A0A0A] flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold animate-pulse shrink-0"
                    style={{ backgroundColor: AGENT_COLORS[typingAgent as keyof typeof AGENT_COLORS] || '#888' }}
                  >{typingAgent[0]}</div>
                  <span className="text-[13px] text-secondary">
                    <span className="text-white font-medium">{typingAgent}</span> is forming a response...
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
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-4 mb-8">
                {replySuccess && (
                  <div className="mb-4 text-green-400 text-[14px] font-medium bg-green-500/10 px-4 py-2 rounded-xl">
                    ✓ Your take was added!
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full bg-[#111] border border-[#1F1F1F] rounded-xl px-4 py-2.5 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[14px] mb-3"
                />
                <textarea
                  placeholder="Share your experience or pushback..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full bg-[#111] border border-[#1F1F1F] rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[14px] min-h-[90px] resize-none mb-4"
                />

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  {['agree', 'disagree'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSentiment(sentiment === s ? '' : s)}
                      className={`flex-1 h-11 rounded-xl text-[14px] font-medium border transition-all flex items-center justify-center gap-2 ${
                        sentiment === s
                          ? s === 'agree' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                          : `bg-[#111] text-secondary border-[#1F1F1F] ${s === 'agree' ? 'hover:border-green-500/50 hover:text-green-400' : 'hover:border-red-500/50 hover:text-red-400'}`
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
                    className="bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-bold px-8 py-3 rounded-xl hover:opacity-90 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brandprimary/20"
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
                            <span className="text-[15px] font-bold text-white">{item.author_name || 'Anonymous'}</span>
                            {item.sentiment === 'agreed' && <span className="text-green-400 text-[11px] font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Agreed</span>}
                            {item.sentiment === 'disagreed' && <span className="text-red-400 text-[11px] font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Disagreed</span>}
                            <span className="text-[12px] text-[#444] ml-auto">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[15px] text-secondary leading-[1.6] bg-[#0A0A0A] p-4 rounded-xl border border-[#1F1F1F]">{item.reply_text}</p>
                        </div>
                        {i !== humanReplies.length - 1 && <div className="w-full h-px bg-[#1F1F1F] mt-6" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* TAB 3: VERDICT */}
            <div className={activeTab === 'Verdict' ? 'block' : 'hidden'}>
              {isLive ? (
                <div className="text-center py-16 text-secondary">
                  <div className="w-6 h-6 border-2 border-brandprimary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>The verdict will appear once all agents have finished debating.</p>
                </div>
              ) : (
                <>
                  {verdict && (
                    <div className="bg-gradient-to-br from-[#0F0A1A] to-[#0A0A0F] border border-brandprimary/30 rounded-2xl p-6 mb-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-brandprimary animate-pulse" />
                        <span className="text-[12px] uppercase tracking-widest font-bold text-brandprimary">AI Consensus Verdict</span>
                      </div>
                      <p className="text-[16px] text-white leading-[1.8] mb-6 font-medium">{verdict.verdict_text}</p>
                      {(verdict.key_takeaway_1 || verdict.key_takeaway_2 || verdict.key_takeaway_3) && (
                        <div className="space-y-4 border-t border-[#1F1F1F] pt-6 mt-2">
                          <p className="text-[12px] uppercase tracking-widest text-secondary font-bold mb-1">Key Takeaways</p>
                          {[verdict.key_takeaway_1, verdict.key_takeaway_2, verdict.key_takeaway_3].filter(Boolean).map((t, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-brandprimary font-black text-[16px]">{i + 1}</span>
                              <p className="text-[14px] text-primary leading-relaxed">{t}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {finalPositions.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-[13px] uppercase tracking-widest font-bold text-secondary mb-6 pl-1">Individual Agent Closings</h3>
                      <div className="space-y-6">
                        {finalPositions.map(fp => {
                          const color = AGENT_COLORS[fp.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                          return (
                            <div key={fp.id} className="border-l-[3px] pl-6 py-1 transition-all" style={{ borderLeftColor: color }}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={AGENT_AVATARS[fp.agent_name as AgentName] || AGENT_AVATARS.Specialist} 
                                    alt={fp.agent_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-bold text-white text-[15px]">{fp.agent_name}</span>
                              </div>
                              <p className="text-[14px] text-secondary leading-[1.7]">{fp.response_text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-borderdefault rounded-2xl p-6 text-center">
                    <h3 className="text-[18px] font-bold text-white mb-2">Has this debate helped you?</h3>
                    <p className="text-[14px] text-secondary mb-4">Submit your own creator problem and get 6 AI agents to debate it publicly.</p>
                    <Link href="/submit" className="inline-flex items-center justify-center bg-gradient-to-r from-brandprimary to-brandorange text-white text-[14px] font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                      Submit Your Problem →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-[80px] self-start order-1 lg:order-2 space-y-4">
          {isLive ? (
            <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[13px] font-bold text-white uppercase tracking-widest">Live Debate</span>
              </div>
              <p className="text-[13px] text-secondary leading-relaxed mb-3">Agents are forming their arguments. New responses appear automatically.</p>
              <div className="h-1.5 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brandprimary to-brandorange rounded-full animate-pulse" style={{ width: `${Math.min(100, (agentResponses.length / 6) * 100)}%` }} />
              </div>
              <p className="text-[11px] text-tertiary mt-2">{agentResponses.length} of 6 agents responded</p>
            </div>
          ) : verdict ? (
            <>
              <Verdict content={verdict.verdict_text} agentCount={finalPositions.length || agentResponses.length} />
              {activeTab !== 'Verdict' && (
                <button
                  onClick={() => handleTabSwitch('Verdict')}
                  className="w-full bg-brandprimarysubtle border border-brandprimary/30 text-brandprimary text-[13px] font-semibold py-3 rounded-xl hover:bg-brandprimary/20 transition-colors"
                >
                  View Full Verdict →
                </button>
              )}
            </>
          ) : null}
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
