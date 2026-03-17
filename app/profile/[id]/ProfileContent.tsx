'use client';

import { useState } from 'react';
import Link from 'next/link';

type ProfileContentProps = {
  profile: any;
  debates: any[];
  replies: any[];
};

export function ProfileContent({ profile, debates, replies }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'debates' | 'takeaways'>('debates');

  return (
    <main className="pt-12 pb-24 px-4 xl:px-0 bg-black">
      <div className="max-w-[1080px] mx-auto">
        
        {/* PROFILE HEADER */}
        <div className="bg-card border border-borderdefault rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brandprimary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-24 h-24 rounded-full bg-brandpurple flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-brandpurple/20 shrink-0">
              {profile.full_name?.[0] || 'U'}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.full_name || 'Creator'}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-brandprimary/10 border border-brandprimary/20 rounded-full text-[13px] font-bold text-brandprimary">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {profile.karma} Karma
                </span>
                {profile.badges?.map((badge: string) => (
                  <span key={badge} className="px-3 py-1 bg-teal-400/10 border border-teal-400/20 rounded-full text-[11px] font-black text-teal-400 uppercase tracking-widest">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-8 border-b border-borderdefault mb-10 px-4">
          <button 
            onClick={() => setActiveTab('debates')}
            className={`pb-4 text-[14px] font-bold transition-all border-b-2 ${
              activeTab === 'debates' ? 'text-white border-brandprimary' : 'text-secondary border-transparent hover:text-primary'
            }`}
          >
            My Debates
            <span className="ml-2 bg-white/5 px-2 py-0.5 rounded text-[11px]">{debates.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('takeaways')}
            className={`pb-4 text-[14px] font-bold transition-all border-b-2 ${
              activeTab === 'takeaways' ? 'text-white border-brandprimary' : 'text-secondary border-transparent hover:text-primary'
            }`}
          >
            My Takeaways
            <span className="ml-2 bg-white/5 px-2 py-0.5 rounded text-[11px]">{replies.length}</span>
          </button>
        </div>

        <div className="max-w-[800px]">
          {activeTab === 'debates' ? (
            <div className="space-y-4">
              {debates.length > 0 ? (
                debates.map((debate) => (
                  <Link 
                    key={debate.id} 
                    href={`/debate/${debate.id}`}
                    className="block p-6 bg-card border border-borderdefault rounded-2xl hover:border-brandprimary/40 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-secondary px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                        {debate.platform || 'General'}
                      </span>
                      <span className="text-[11px] text-tertiary ml-auto">
                        {new Date(debate.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-bold text-white group-hover:text-brandprimary transition-colors line-clamp-2">
                       {debate.topic}
                    </h3>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center bg-card border border-borderdefault rounded-3xl border-dashed">
                  <p className="text-secondary text-[15px]">You haven&apos;t started any debates yet.</p>
                  <Link href="/submit" className="mt-4 inline-block text-brandprimary font-bold hover:underline">Start your first debate →</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className="p-6 bg-card border border-borderdefault rounded-2xl"
                  >
                    <Link 
                      href={`/debate/${reply.thread_id}`}
                      className="text-[13px] font-bold text-brandprimary hover:underline block mb-3"
                    >
                      Re: {(reply.thread as any)?.topic} →
                    </Link>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 italic text-[15px] text-primary leading-relaxed">
                      &quot;{reply.reply_text}&quot;
                    </div>
                    <div className="flex items-center gap-3">
                      {reply.sentiment && (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          reply.sentiment === 'agreed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {reply.sentiment}
                        </span>
                      )}
                      <span className="text-[12px] text-tertiary ml-auto">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-card border border-borderdefault rounded-3xl border-dashed">
                  <p className="text-secondary text-[15px]">You haven&apos;t shared any takeaways yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
