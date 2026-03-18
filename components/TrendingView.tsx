/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { useState } from 'react';

export function TrendingView({ initialThreads }: { initialThreads: any[] }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredDebates = activeFilter === 'All' 
    ? initialThreads 
    : initialThreads.filter(item => item.platform === activeFilter || (activeFilter === 'Multi-platform' && item.platform === null));

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-[32px] font-bold text-primary tracking-[-0.02em] mb-2">Trending Debates</h1>
        <p className="text-[15px] text-secondary">The most viewed creator problems being debated right now</p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['All', 'YouTube', 'Instagram', 'TikTok', 'Multi-platform'].map((filter) => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)} 
            className={`h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border ${
              activeFilter === filter ? 'bg-brandprimarysubtle text-white border-brandprimary' : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Trending List */}
      <div className="flex flex-col border border-borderdefault rounded-2xl bg-card overflow-hidden">
        {filteredDebates.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            No trending debates found for {activeFilter}.
          </div>
        ) : (
          filteredDebates.map((item, i) => {
            const platform = item.platform || "Multi-platform";
            let badgeStyle = "bg-[#FFFFFF15] text-[#FFFFFF]"; 
            if (platform === "YouTube") badgeStyle = "bg-[#FF000015] text-[#FF4444]";
            if (platform.includes("Instagram")) badgeStyle = "bg-[#E1306C15] text-[#E1306C]";
            if (platform.includes("TikTok")) badgeStyle = "bg-[#00F2FE15] text-[#00F2FE]";

            const isHot = (new Date().getTime() - new Date(item.created_at).getTime()) < 86400000 && ((item.human_replies?.[0]?.count || 0) + (item.agent_responses?.[0]?.count || 0) > 5);

            return (
              <div key={item.id} className={`p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-cardhover transition-colors ${i !== filteredDebates.length - 1 ? 'border-b border-borderdefault' : ''}`}>
                <div className="text-[18px] font-bold text-brandprimary pt-1 w-8 shrink-0">
                  {(i + 1).toString().padStart(2, '0')}
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[14px] font-semibold text-primary">{item.submitted_by || 'Anonymous'}</span>
                    <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>
                      {platform}
                    </span>
                    {isHot && (
                      <span className="flex items-center text-orange-500 text-[12px] font-medium ml-1">
                        <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                        Hot
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-[16px] font-semibold text-primary leading-snug mb-3 pr-4">
                    {item.topic}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto w-full">
                    <div className="flex items-center space-x-4 text-[13px] text-secondary">
                      <span>{item.human_replies?.[0]?.count || 0} replies</span>
                      <span>{item.agent_responses?.[0]?.count || 0} agents</span>
                    </div>
                    <Link href={`/debate/${item.id}`} className="text-brandprimary text-[13px] font-medium hover:underline shrink-0">
                      Read Debate →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
