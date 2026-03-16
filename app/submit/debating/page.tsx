'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function DebatingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [threadId, setThreadId] = useState('');

  const messages = [
    "Axel is analyzing the algorithm signals...",
    "Nova is considering the audience angle...",
    "Rex is preparing to challenge everything...",
    "Leo is thinking about the business impact...",
    "Sage is looking at execution options...",
    "Zara is checking virality patterns..."
  ];

  useEffect(() => {
    // Get temporary thread ID
    const tId = sessionStorage.getItem('tempThreadId') || 'pending_thread';
    setThreadId(tId);

    if (!tId || tId.startsWith('pending')) {
      router.push('/');
      return;
    }

    const supabase = createClient();

    // Poll Supabase every 5s for status 'published'
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('threads')
        .select('status')
        .eq('id', tId)
        .single();
        
      if (data?.status === 'published') {
        sessionStorage.removeItem('tempSubmissionText');
        sessionStorage.removeItem('tempQuestions');
        sessionStorage.removeItem('tempThreadId');
        router.push(`/debate/${tId}`);
      }
    }, 5000);

    // Cycle messages every 3 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);

    // Fake progress bar reaching 90% over 90 seconds (1% per second)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 1;
      });
    }, 1000);

    // Show Share block after 30 seconds
    const showShareTimer = setTimeout(() => {
      setShowShare(true);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(showShareTimer);
    };
  }, [router, messages.length]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 fade-in">
      <div className="max-w-[480px] w-full flex flex-col items-center text-center">
        
        {/* Pulsing Circle Animation */}
        <div className="relative w-24 h-24 mb-10">
          <div className="absolute inset-0 bg-brandprimary rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-2 bg-brandprimary rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute inset-4 bg-brandprimary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>

        <h2 className="text-[24px] font-bold text-white mb-2 tracking-[-0.01em]">
          Agents are debating your problem
        </h2>
        <p className="text-[15px] text-secondary mb-10">
          This takes about 2 minutes
        </p>

        {/* Live Activity Messages */}
        <div className="h-6 mb-8 overflow-hidden">
          <div 
            key={messageIndex}
            className="text-[14px] font-medium text-brandprimary animate-[slideUp_0.3s_ease-out_forwards]"
          >
            {messages[messageIndex]}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#111] border border-[#1F1F1F] rounded-full h-2.5 mb-2 overflow-hidden">
          <div 
            className="bg-brandprimary h-2.5 rounded-full transition-all duration-1000 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="w-full flex justify-between text-[11px] text-tertiary mb-12">
          <span>0%</span>
          <span>{progress}%</span>
        </div>

        {/* Share Option (Shows after 30s) */}
        {showShare && (
          <div className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 animate-[fadeIn_0.5s_ease-out_forwards]">
            <p className="text-[13px] font-medium text-white mb-3 text-left">Share this debate before it&apos;s done:</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://feed.creedom.ai'}/debate/${threadId}`}
                className="flex-1 bg-[#111] border border-[#1F1F1F] rounded-lg px-3 py-2 text-[12px] text-secondary focus:outline-none"
              />
              <button 
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'https://feed.creedom.ai'}/debate/${threadId}`)}
                className="bg-[#222] hover:bg-[#333] border border-[#333] text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
