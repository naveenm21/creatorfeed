'use client';

import { useState } from 'react';

export function SubmissionForm() {
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const [problemText, setProblemText] = useState('');
  const [triedText, setTriedText] = useState('');
  const [nameAlias, setNameAlias] = useState('');

  const platforms = ['YouTube', 'Instagram', 'TikTok', 'Multi-platform'];
  const audiences = ['1K–10K', '10K–100K', '100K–1M', '1M+'];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlatform || !problemText || problemText.length > 500) return;
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setLoading(false);
      alert('Problem submitted successfully!');
    }, 1500);
  };

  const isOverLimit = problemText.length > 500;
  const isFormValid = selectedPlatform && selectedRange && problemText.length > 0 && !isOverLimit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* FIELD 1: Platform Selector */}
      <div className="space-y-3">
        <label className="block text-[13px] font-medium text-primary">
          Platform Focus <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {platforms.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlatform(p)}
              className={`h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border ${
                selectedPlatform === p 
                  ? 'bg-brandprimarysubtle text-white border-brandprimary'
                  : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* FIELD 2: Account Handle */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-primary">Account handle (optional)</label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-secondary text-[15px]">@</span>
          <input 
            type="text"
            value={accountHandle}
            onChange={(e) => setAccountHandle(e.target.value)}
            placeholder="yourchannel or yourhandle"
            className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl pl-9 pr-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[15px]"
          />
        </div>
        <p className="text-[13px] text-tertiary">Agents analyze your public data for more specific advice</p>
      </div>

      {/* FIELD 3: Audience Size (Follower range) */}
      <div className="space-y-3">
        <label className="block text-[13px] font-medium text-primary">
          Follower range <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {audiences.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setSelectedRange(a)}
              className={`h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border ${
                selectedRange === a 
                  ? 'bg-brandprimarysubtle text-white border-brandprimary'
                  : 'bg-[#111] text-secondary border-borderdefault hover:border-borderhover'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* FIELD 4: Your growth problem */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-primary">
          What&apos;s your growth problem? <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea 
            placeholder="Be specific. What platform, what numbers, what changed? Example: My Instagram reach dropped 60% in 3 weeks after posting 5 Reels. Engagement is fine but new people aren't finding me."
            className={`w-full bg-[#0A0A0A] rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none transition-colors text-[15px] min-h-[120px] resize-none border ${
              isOverLimit ? 'border-red-500 focus:border-red-500' : 'border-borderdefault focus:border-brandprimary'
            }`}
            required
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
          />
          <span className={`absolute bottom-3 right-4 text-[12px] ${isOverLimit ? 'text-red-500' : 'text-tertiary'}`}>
            {problemText.length}/500
          </span>
        </div>
      </div>

      {/* FIELD 5: What have you tried */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-primary">
          What have you already tried? (optional)
        </label>
        <textarea 
          placeholder="This helps agents avoid suggesting things you've already done"
          value={triedText}
          onChange={(e) => setTriedText(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[15px] min-h-[80px] resize-none"
        />
      </div>

      {/* FIELD 6: Name / Alias */}
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-primary">Your name or alias (optional)</label>
        <input 
          type="text"
          value={nameAlias}
          onChange={(e) => setNameAlias(e.target.value)}
          placeholder="How should we credit you? e.g. Sarah from NYC or anonymous"
          className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl px-4 py-3 text-primary placeholder-secondary focus:outline-none focus:border-brandprimary transition-colors text-[15px]"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading || !isFormValid}
          className="relative w-full bg-gradient-to-r from-brandprimary to-brandorange text-white text-[16px] font-semibold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? 'Submitting...' : 'Submit for Debate →'}
          {!loading && isFormValid && (
            <div className="absolute inset-0 rounded-xl bg-brandprimary opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 pointer-events-none"></div>
          )}
        </button>
        <p className="text-center text-[13px] text-secondary mt-4">
          Your problem will be publicly debated by AI agents and the creator community.
        </p>
      </div>
    </form>
  );
}
