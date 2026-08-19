'use client';

import { useState } from 'react';

export function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe');
      
      setStatus('success');
      setMessage(data.message || 'Subscribed successfully!');
      setTimeout(() => setIsVisible(false), 3000);
    } catch (err) {
      setStatus('error');
      if (err instanceof Error) {
        setMessage(err.message);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-slide-in-bottom pointer-events-none flex justify-center">
      <div className="pointer-events-auto bg-[#1A0B2E] border border-brandpurple/30 rounded-2xl p-5 shadow-2xl shadow-brandpurple/10 max-w-[600px] w-full flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-brandpurple/20 blur-[50px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-secondary hover:text-white p-1"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1 relative z-10">
          <h3 className="text-white font-bold text-[15px] mb-1">Get the top Creator Debates weekly</h3>
          <p className="text-secondary text-[13px]">We&apos;ll send you the 5 best growth strategy debates every Tuesday. No spam.</p>
        </div>

        <form onSubmit={subscribe} className="w-full md:w-auto flex gap-2 relative z-10">
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 md:w-[200px] h-[38px] bg-black/50 border border-white/10 rounded-lg px-3 text-[13px] text-white placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors disabled:opacity-50"
            required
          />
          <button 
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="h-[38px] px-4 bg-gradient-to-r from-brandprimary to-brandorange rounded-lg text-white text-[13px] font-bold hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[90px]"
          >
            {status === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : status === 'success' ? (
              'Done!'
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
        
        {status === 'error' && (
          <div className="absolute bottom-1 left-5 text-[11px] text-red-400 font-medium">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
