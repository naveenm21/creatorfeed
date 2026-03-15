'use client';

import { useState } from 'react';

export function SubmissionForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Add submission logic
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Problem Title</label>
        <input 
          type="text" 
          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea 
          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white h-32"
          required
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Problem'}
      </button>
    </form>
  );
}
