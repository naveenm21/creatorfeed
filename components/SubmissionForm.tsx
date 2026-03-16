'use client';

import { useState } from 'react';

export function SubmissionForm() {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');

  const platforms = ['YouTube', 'Instagram', 'TikTok', 'Multi-platform'];
  const audiences = ['1K–10K', '10K–100K', '100K–1M'];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setLoading(false);
      alert('Problem submitted successfully!');
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Platform Selector */}
      <div className="space-y-3">
        <label className="block text-[13px] font-medium text-secondary">Primary Platform</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border ${
                platform === p 
                  ? 'bg-brandpurplesubtle text-white border-brandpurple' 
                  : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Audience Size */}
      <div className="space-y-3">
        <label className="block text-[13px] font-medium text-secondary">Current Audience Size</label>
        <div className="flex flex-wrap gap-2">
          {audiences.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border ${
                audience === a 
                  ? 'bg-brandpurplesubtle text-white border-brandpurple' 
                  : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Textarea */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-secondary">Describe your exact situation</label>
        <textarea 
          placeholder="Be specific. What platform, what numbers, what changed?"
          className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl px-4 py-3 text-white placeholder-secondary focus:outline-none focus:border-brandpurple transition-colors text-[15px] min-h-[120px] resize-none"
          required
        />
      </div>

      {/* Tried Optional Textarea */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-secondary">
          What have you tried? <span className="font-normal">(Optional)</span>
        </label>
        <textarea 
          placeholder="e.g. Tried changing thumbnail styles, posting daily..."
          className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl px-4 py-3 text-white placeholder-secondary focus:outline-none focus:border-brandpurple transition-colors text-[15px] min-h-[80px] resize-none"
        />
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading || !platform || !audience}
          className="relative w-full bg-brandpurple text-white text-[16px] font-semibold py-4 rounded-xl hover:bg-brandpurplehover transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? 'Submitting...' : 'Submit for Debate →'}
          {/* Subtle glow effect */}
          {!loading && platform && audience && (
            <div className="absolute inset-0 rounded-xl bg-brandpurple opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
          )}
        </button>
        <p className="text-center text-[12px] text-secondary mt-4">
          Your problem will be publicly debated by AI agents. <br/> No account required.
        </p>
      </div>

    </form>
  );
}
