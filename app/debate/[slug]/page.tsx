/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useRef, useEffect, use } from 'react';
import { Verdict } from '@/components/Verdict';
import { createClient } from '@/lib/supabase';
import { AGENT_COLORS } from '@/lib/agents';

export default function DebatePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  
  const [activeTab, setActiveTab] = useState('AI Debate');
  const [respondingTo, setRespondingTo] = useState('General');
  const [sentiment, setSentiment] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<any>(null);
  const [agentResponses, setAgentResponses] = useState<any[]>([]);
  const [finalPositions, setFinalPositions] = useState<any[]>([]);
  const [verdict, setVerdict] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDebate() {
      const { data: t } = await supabase.from('threads').select('*').eq('id', slug).single();
      const { data: r } = await supabase.from('agent_responses')
        .select('*')
        .eq('thread_id', slug)
        .order('round_number', { ascending: true })
        .order('response_order', { ascending: true });
      const { data: v } = await supabase.from('verdicts').select('*').eq('thread_id', slug).single();
      
      setThread(t);
      if (r) {
        setAgentResponses(r.filter(x => !x.is_final_position));
        setFinalPositions(r.filter(x => x.is_final_position));
      }
      setVerdict(v);
      setLoading(false);
    }
    fetchDebate();
  }, [slug, supabase]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brandprimary border-t-transparent rounded-full animate-spin"/>
    </main>
  );

  if (!thread) return (
    <main className="min-h-screen flex items-center justify-center text-white">Debate not found</main>
  );

  const platform = thread.platform || "Platform";
  let badgeStyle = "bg-[#FFFFFF15] text-[#FFFFFF]"; 
  if (platform === "YouTube") badgeStyle = "bg-[#FF000015] text-[#FF4444]";
  if (platform.includes("Instagram")) badgeStyle = "bg-[#E1306C15] text-[#E1306C]";
  if (platform.includes("TikTok")) badgeStyle = "bg-[#00F2FE15] text-[#00F2FE]";

  // Group responses by round_number
  const roundsMap = agentResponses.reduce((acc, curr) => {
    if (!acc[curr.round_number]) acc[curr.round_number] = [];
    acc[curr.round_number].push(curr);
    return acc;
  }, {} as Record<number, any[]>);
  const rounds = Object.keys(roundsMap).map(Number).sort((a,b) => a - b);

  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
    if (contentRef.current) {
      const yOffset = -120;
      const y = contentRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen pt-10 pb-20 fade-in px-4 xl:px-0">
      <div className="max-w-[1080px] mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 lg:max-w-[720px] order-2 lg:order-1 mt-8 lg:mt-0">
          
          {/* PART 1: THREAD HEADER */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[15px] font-semibold text-primary">{thread.submitted_by || 'Anonymous'}</span>
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>
                {platform}
              </span>
            </div>
            <h1 className="text-[28px] font-bold text-white tracking-[-0.01em] leading-snug mb-4">
              {thread.topic}
            </h1>
            <div className="text-[14px] text-secondary leading-relaxed mb-4 border-l-2 border-[#333] pl-4 italic">
              &quot;{thread.raw_submission}&quot;
            </div>
            <div className="text-[13px] text-secondary flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span>{agentResponses.length} AI responses</span>
              <span>·</span>
              <span>0 creator responses</span>
            </div>
          </div>
          <div className="w-full h-px bg-[#1F1F1F] mb-0" />

          {/* PART 2: STICKY TAB BAR */}
          <div className="sticky top-[56px] z-20 bg-[#000000]/80 backdrop-blur border-b border-[#1F1F1F] h-[48px] flex items-center gap-6 mb-8 px-2">
            
            <button 
              onClick={() => handleTabSwitch('AI Debate')}
              className={`h-full flex items-center border-b-2 transition-colors duration-200 ${
                activeTab === 'AI Debate' ? 'border-brandprimary text-white' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="text-[14px] font-medium mr-2">AI Debate</span>
            </button>

            <button 
              onClick={() => handleTabSwitch('Community')}
              className={`h-full flex items-center border-b-2 transition-colors duration-200 relative ${
                activeTab === 'Community' ? 'border-teal-400 text-white' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="text-[14px] font-medium mr-2">Community</span>
            </button>

          </div>

          {/* CONTENT SECTION */}
          <div ref={contentRef} className="pb-10">
            
            {/* TAB 1: AI DEBATE */}
            <div className={activeTab === 'AI Debate' ? 'block' : 'hidden'}>
              {rounds.map((roundNum, roundIdx) => (
                <div key={roundNum} className="mb-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-[#1F1F1F] flex-1"></div>
                    <span className="text-[11px] uppercase tracking-widest font-bold text-brandprimary">Round {roundNum}</span>
                    <div className="h-px bg-[#1F1F1F] flex-1"></div>
                  </div>
                  
                  {roundsMap[roundNum].map((agent: any, i: number) => {
                    const color = AGENT_COLORS[agent.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                    const isLastInRound = i === roundsMap[roundNum].length - 1;
                    return (
                      <div key={agent.id} className="mb-6">
                        <div className="pl-4 border-l-[3px] flex flex-col py-1" style={{ borderLeftColor: color }}>
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {agent.agent_name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-bold text-white leading-tight">{agent.agent_name}</span>
                              <span className="text-[13px] text-secondary">{agent.expertise}</span>
                            </div>
                            {agent.position && agent.position !== 'none' && (
                              <div className="ml-auto">
                                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${
                                  agent.position === 'agree' ? 'bg-green-500/10 text-green-400' :
                                  agent.position === 'disagree' ? 'bg-red-500/10 text-red-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {agent.position}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[15px] text-white leading-[1.7] mb-3 pr-2">
                            {agent.response_text}
                          </p>
                        </div>

                        {!isLastInRound && (
                          <div className="w-full h-px bg-[#1F1F1F] mt-[24px]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* TAB 2: COMMUNITY */}
            <div className={activeTab === 'Community' ? 'block' : 'hidden'}>
              
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-4 mb-8">
                <textarea 
                  placeholder="Share your experience or pushback..."
                  className="w-full bg-[#111] border border-[#1F1F1F] rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[14px] min-h-[90px] resize-none mb-4"
                />
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[12px] text-tertiary">Community replies coming soon</span>
                  <button disabled className="bg-[#1F1F1F] text-[#666] text-[13px] font-medium px-5 py-2 rounded-xl cursor-not-allowed">
                    Post Your Take →
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — CONTEXT SIDEBAR */}
        <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[80px] self-start order-1 lg:order-2 space-y-6 lg:block">

          {finalPositions.length > 0 && (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-5">
              <h3 className="text-[15px] font-bold text-white mb-4">Final Positions</h3>
              <div className="space-y-4">
                {finalPositions.map(fp => {
                  const color = AGENT_COLORS[fp.agent_name as keyof typeof AGENT_COLORS] || '#FFFFFF';
                  return (
                    <div key={fp.id} className="text-[13px] border-l-2 pl-3" style={{ borderLeftColor: color }}>
                      <span className="font-bold text-white block mb-0.5">{fp.agent_name}</span>
                      <span className="text-secondary leading-relaxed">{fp.response_text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {verdict && (
            <Verdict 
              content={verdict.verdict_text} 
              agentCount={finalPositions.length || 4}
            />
          )}

        </div>

      </div>
    </main>
  );
}
