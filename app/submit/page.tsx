/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'
import { PROBLEM_TAGS } from '@/lib/constants/problem-tags';

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [problemText, setProblemText] = useState('');
  const [customName, setCustomName] = useState((user?.user_metadata as any)?.display_name || user?.email?.split('@')[0] || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [randomTags, setRandomTags] = useState<string[]>([]);

  useEffect(() => {
    // Pick 3 random tags
    const shuffled = [...PROBLEM_TAGS].sort(() => 0.5 - Math.random());
    setRandomTags(shuffled.slice(0, 3));
  }, []);

  const handleExampleClick = (text: string) => {
    setProblemText(text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problemText.length < 20) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawSubmission: problemText,
          userId: user?.id,
          submittedBy: isAnonymous ? 'Anonymous' : (customName || 'Anonymous')
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Intake failed');
      }
      
      const data = await res.json();
      
      if (data.needsQuestions) {
        sessionStorage.setItem('tempThreadId', data.threadId);
        sessionStorage.setItem('tempQuestions', JSON.stringify(data.questions));
        sessionStorage.setItem('tempSubmissionText', problemText);
        router.push('/submit/questions');
      } else {
        sessionStorage.setItem('tempThreadId', data.threadId);
        router.push('/submit/debating');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsSubmitting(false);
    }
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

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-slideIn">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white mb-0.5">Content Blocked</p>
                <p className="text-[13px] text-red-100/70 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <textarea
                value={problemText}
                onChange={(e) => {
                  setProblemText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Example: My YouTube views dropped 60% last month after I started posting daily instead of 3x a week. I have 45K subscribers. I haven't changed my content style but something clearly changed with the algorithm. I tried posting at different times but nothing worked."
                className={`w-full bg-[#0A0A0A] border rounded-xl px-5 py-4 text-white placeholder-secondary focus:outline-none transition-colors text-[15px] min-h-[200px] resize-y shadow-inner ${
                  error ? 'border-red-500/50' : 'border-[#1F1F1F] focus:border-brandprimary'
                }`}
              />
              <div className="absolute bottom-4 right-4 text-[12px] text-tertiary">
                {problemText.length} characters
              </div>
            </div>

            <div className="mb-8 flex flex-wrap gap-2 justify-center">
              {randomTags.map((tag) => (
                <button 
                  key={tag}
                  type="button"
                  onClick={() => handleExampleClick(tag)}
                  className="bg-[#111] hover:bg-[#1A1A1A] border border-[#1F1F1F] text-secondary text-[12px] px-3 py-1.5 rounded-full transition-colors"
                >
                  &quot;{tag}&quot;
                </button>
              ))}
            </div>

            {/* IDENTITY SETTINGS */}
            <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 mb-8">
              <h3 className="text-[14px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brandprimary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Identity Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-[12px] text-secondary font-medium mb-1.5 ml-1">Display Name</label>
                    <input 
                      type="text"
                      disabled={isAnonymous}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Your Name or Nickname"
                      className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-4 py-2.5 text-white placeholder-secondary focus:outline-none focus:border-brandprimary transition-all text-[14px] disabled:opacity-30"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-transparent hover:border-[#1F1F1F] transition-all">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-[#333] transition-all checked:border-brandprimary checked:bg-brandprimary"
                    />
                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-white group-hover:text-brandprimary transition-colors">Post Anonymously</span>
                    <span className="text-[12px] text-tertiary">Your name will be hidden from the public debate</span>
                  </div>
                </label>
              </div>
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
