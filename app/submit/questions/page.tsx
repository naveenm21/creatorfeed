'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuestionsPage() {
  const router = useRouter();
  const [submissionText, setSubmissionText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [platform, setPlatform] = useState('');
  const [followers, setFollowers] = useState('');
  const [whatChanged, setWhatChanged] = useState('');

  useEffect(() => {
    // Client-side only retrieval mapping the previous step
    const savedText = localStorage.getItem('tempSubmissionText') || '';
    if (!savedText) {
      router.push('/submit');
    }
    setSubmissionText(savedText);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !followers || !whatChanged) return;
    
    setIsSubmitting(true);
    
    // Using a setTimeout mock loop for API request representation
    setTimeout(() => {
      // Mock thread ID creation
      localStorage.setItem('tempThreadId', 'thread_' + Math.random().toString(36).substr(2, 9));
      router.push('/submit/debating');
    }, 1000);
  };

  const isFormComplete = platform && followers && whatChanged.length > 5;

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <div className="max-w-[640px] mx-auto">
        
        {/* PROGRESS INDICATOR */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-[12px] text-tertiary mb-2 font-medium">Step 2 of 2</span>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 sm:p-10 mb-8 relative">
          
          <Link href="/submit" className="absolute left-6 top-6 sm:left-10 sm:top-10 text-secondary hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
          <div className="mb-6 flex justify-center mt-1 sm:mt-0">
             <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-teal-500/20">
               QUICK QUESTIONS
             </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-white tracking-[-0.01em] mb-3">
              Got it — 2 quick questions
            </h1>
            <p className="text-[15px] text-secondary">
              These help agents give you specific advice, not generic tips
            </p>
          </div>

          {/* ORIGINAL SUBMISSION PREVIEW */}
          <div className="mb-10 bg-[#0A0A0A] border border-[#1F1F1F] border-l-[3px] border-l-brandprimary rounded-r-xl p-4">
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-wider block mb-2">Your problem:</span>
            <p className="text-[14px] text-secondary leading-relaxed">
              {isExpanded ? submissionText : (submissionText.length > 100 ? `${submissionText.slice(0, 100)}...` : submissionText)}
            </p>
            {submissionText.length > 100 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[12px] font-medium text-brandprimary hover:text-brandorange transition-colors mt-2"
              >
                {isExpanded ? 'Show less' : 'Expand full text'}
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Question 1: Platform */}
            <div>
              <label className="block text-white text-[16px] font-medium mb-3">Which platform is this about?</label>
              <div className="flex flex-wrap gap-3">
                {['YouTube', 'Instagram', 'TikTok', 'Multi-platform'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPlatform(opt)}
                    className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all border ${
                      platform === opt 
                        ? 'bg-brandprimary border-brandprimary text-white' 
                        : 'bg-[#111] border-[#222] text-secondary hover:border-[#444]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Followers */}
            <div>
              <label className="block text-white text-[16px] font-medium mb-3">How many followers do you have?</label>
              <div className="flex flex-wrap gap-3">
                {['Under 10K', '10K-100K', '100K-1M', 'Over 1M'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFollowers(opt)}
                    className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all border ${
                      followers === opt 
                        ? 'bg-brandprimary border-brandprimary text-white' 
                        : 'bg-[#111] border-[#222] text-secondary hover:border-[#444]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: What Changed? */}
            <div>
              <label className="block text-white text-[16px] font-medium mb-3">What changed around the time this started?</label>
              <textarea
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder="Ex. Switched editing styles, algorithm update, took a break..."
                className="w-full bg-[#111] border border-[#1F1F1F] rounded-xl px-4 py-3 text-white placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[14px] min-h-[100px] resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={!isFormComplete || isSubmitting}
              className={`w-full py-4 rounded-xl text-white text-[15px] font-bold transition-all flex justify-center items-center mt-4 ${
                isFormComplete && !isSubmitting
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
                  Starting debate...
                </>
              ) : (
                'Start the Debate →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-tertiary">
            <p>Agents will start debating immediately · Expected time: ~2 minutes</p>
          </div>
          
        </div>
      </div>
    </main>
  );
}
