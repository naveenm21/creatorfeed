import Link from 'next/link';

export function DebateCard({ debate }: { debate: { id: string, creatorName: string, platform: string, timePosted: string, title: string, preview: string, agents: string[], replies: number, humanReplies: number, views: string } }) {
  // Map platform to pill styles
  let badgeStyle = "bg-[#FFFFFF15] text-[#FFFFFF]"; // TikTok/Default
  if (debate.platform === "YouTube") badgeStyle = "bg-[#FF000015] text-[#FF4444]";
  if (debate.platform === "Instagram") badgeStyle = "bg-[#E1306C15] text-[#E1306C]";

  // Agent colors mapping
  const agentColors: Record<string, string> = {
    Riya: "#7C3AED",
    Marcus: "#2563EB",
    Priya: "#DB2777",
    Dev: "#0D9488",
    Karan: "#D97706",
  };

  return (
    <div className="py-4 border-b border-borderdefault hover:bg-card cursor-pointer transition-colors duration-150 group">
      <Link href={`/debate/${debate.id}`} className="block px-4 sm:px-0">
        {/* ROW 1: Creator line */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-[15px] font-semibold text-white">{debate.creatorName}</span>
            <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>
              {debate.platform}
            </span>
          </div>
          <span className="text-[13px] text-tertiary">{debate.timePosted}</span>
        </div>

        {/* ROW 2: Debate topic */}
        <h2 className="text-[17px] font-semibold text-white mt-1 line-clamp-2 leading-snug">
          {debate.title}
        </h2>

        {/* ROW 3: Agent response preview */}
        <p className="text-[14px] text-secondary mt-1.5 line-clamp-2 leading-relaxed">
          {debate.preview}
        </p>

        {/* Bifurcation counts */}
        <div className="flex items-center space-x-3 mt-2">
          <span className="text-[11px] font-medium text-brandprimary">
            {debate.replies} AI responses
          </span>
          <span className="text-[11px] font-medium text-teal-500">
            {debate.humanReplies} creator responses
          </span>
        </div>

        {/* ROW 4: Bottom action row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-3">
              {debate.agents.map((agent: string, idx: number) => (
                <div 
                  key={idx} 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold text-white border-2 border-background z-10 relative"
                  style={{ backgroundColor: agentColors[agent] || '#7C3AED', zIndex: 10 - idx }}
                >
                  {agent.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-[14px] text-secondary">
              {debate.agents.length} agents debated
            </span>
          </div>

          <div className="flex items-center space-x-5">
            <div className="flex items-center text-secondary text-[13px] hover:text-brandprimary transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              {debate.replies}
            </div>
            <div className="flex items-center text-secondary text-[13px] hover:text-brandprimary transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              {debate.views}
            </div>
            <button className="text-secondary hover:text-brandprimary transition-colors text-[13px]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </button>
            <span className="text-brandprimary text-[13px] font-medium group-hover:underline">
              Read →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
