'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [problemText, setProblemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExampleClick = (text: string) => {
    setProblemText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemText.length < 20) return;
    
    setIsSubmitting(true);
    
    // Store in localStorage temporarily as requested by the spec
    localStorage.setItem('tempSubmissionText', problemText);
    
    // Simulate short network delay then route to step 2
    setTimeout(() => {
      router.push('/submit/questions');
    }, 600);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?next=/submit')
    }
  }, [user, loading, router])

  if (loading) return (
    <main className="min-h-screen flex items-center 
      justify-center">
      <div className="w-6 h-6 border-2 
        border-purple-500 border-t-transparent 
        rounded-full animate-spin"/>
    </main>
  )

  if (!user) return null

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <div className="max-w-[640px] mx-auto">
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 sm:p-10 mb-8">
          
          <div className="mb-6 flex justify-center">
             <span className="bg-brandprimarysubtle text-brandprimary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-brandprimary/20">
               AI DEBATE
             </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-white tracking-[-0.01em] mb-3">
              What&apos;s your creator problem?
            </h1>
            <p className="text-[15px] text-secondary">
              Write it in your own words. The more specific, the better the debate.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Example: My YouTube views dropped 60% last month after I started posting daily instead of 3x a week. I have 45K subscribers. I haven't changed my content style but something clearly changed with the algorithm. I tried posting at different times but nothing worked."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-5 py-4 text-white placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[15px] min-h-[200px] resize-y"
              />
              <div className="absolute bottom-4 right-4 text-[12px] text-tertiary">
                {problemText.length} characters
              </div>
            </div>

            <div className="mb-8 flex flex-wrap gap-2 justify-center">
              <button 
                type="button"
                onClick={() => handleExampleClick("My Instagram reach collapsed after brand deals")}
                className="bg-[#111] hover:bg-[#1A1A1A] border border-[#1F1F1F] text-secondary text-[12px] px-3 py-1.5 rounded-full transition-colors"
              >
                &quot;My Instagram reach collapsed after brand deals&quot;
              </button>
              <button 
                type="button"
                onClick={() => handleExampleClick("YouTube views down 60% after daily posting")}
                className="bg-[#111] hover:bg-[#1A1A1A] border border-[#1F1F1F] text-secondary text-[12px] px-3 py-1.5 rounded-full transition-colors"
              >
                &quot;YouTube views down 60% after daily posting&quot;
              </button>
              <button 
                type="button"
                onClick={() => handleExampleClick("TikTok growth stalled at 50K followers")}
                className="bg-[#111] hover:bg-[#1A1A1A] border border-[#1F1F1F] text-secondary text-[12px] px-3 py-1.5 rounded-full transition-colors"
              >
                &quot;TikTok growth stalled at 50K followers&quot;
              </button>
            </div>

            <button
              type="submit"
              disabled={problemText.length < 20 || isSubmitting}
              className={`w-full py-4 rounded-xl text-white text-[15px] font-bold transition-all flex justify-center items-center ${
                problemText.length >= 20 && !isSubmitting
                  ? 'bg-gradient-to-r from-brandprimary to-brandorange hover:opacity-90' 
                  : 'bg-[#1F1F1F] text-[#666] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze My Problem →'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] text-tertiary">
            <p className="mb-4">Our AI will ask 2-3 quick questions, then 4-6 agents will debate your problem publicly</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span className="flex items-center"><svg className="w-4 h-4 mr-1 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Takes 2 minutes</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center"><svg className="w-4 h-4 mr-1 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Completely free</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center"><svg className="w-4 h-4 mr-1 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>No account needed</span>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
