import Link from 'next/link';
import { AGENT_AVATARS, AgentName } from '@/lib/agents';

export function DebateCard({ debate }: { debate: { id: string, creatorName: string, platform: string, timePosted: string, title: string, preview: string, agents: string[], agentCount: number, replies: number, humanReplies: number, views: string } }) {
  // Map platform to pill styles
  let badgeStyle = "bg-[#FFFFFF15] text-[#FFFFFF]"; // TikTok/Default
  if (debate.platform === "YouTube") badgeStyle = "bg-[#FF000015] text-[#FF4444]";
  if (debate.platform === "Instagram") badgeStyle = "bg-[#E1306C15] text-[#E1306C]";

  return (
    <div className="py-5 border-b border-[#343536] hover:bg-[#1A1A1B] cursor-pointer transition-colors duration-200 group relative">
      <Link href={`/debate/${debate.id}`} className="block px-4 sm:px-1">
        {/* ROW 1: Creator line */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[13px] font-bold text-white leading-tight">{debate.creatorName}</span>
            <span className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-sm ${badgeStyle} border border-current opacity-90`}>
              {debate.platform}
            </span>
          </div>
          <span className="text-[12px] text-[#818384] font-medium">{debate.timePosted}</span>
        </div>

        {/* ROW 2: Debate topic */}
        <h2 className="text-[18px] font-semibold text-[#D7DADC] mt-1 line-clamp-2 leading-relaxed tracking-tight group-hover:text-white transition-colors">
          {debate.title}
        </h2>

        {/* ROW 3: Agent response preview */}
        <p className="text-[14px] text-[#818384] mt-2 line-clamp-2 leading-relaxed">
          {debate.preview}
        </p>

        {/* ROW 4: Bottom action row */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-1.5">
              {debate.agents.slice(0, 3).map((agent: string, idx: number) => (
                <div 
                  key={idx} 
                  className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#030303] bg-[#1A1A1B] z-10 relative overflow-hidden"
                  style={{ zIndex: 10 - idx }}
                >
                  <img 
                    src={AGENT_AVATARS[agent as AgentName] || AGENT_AVATARS.Specialist} 
                    alt={agent}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-[#818384] text-[12px] font-bold uppercase tracking-wider">
              <span>{debate.agentCount} Agents</span>
              <span className="w-1 h-1 rounded-full bg-[#343536]" />
              <span>{debate.replies} Replies</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center font-bold text-[#818384] text-[13px] hover:text-[#FF4500] transition-colors">
              <svg className="w-5 h-5 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {debate.views}
            </div>
            <span className="text-[#FF4500] text-[13px] font-bold hover:underline">
              Join Debate →
            </span>
          </div>
        </div>
      </Link>
    </div>
      </Link>
    </div>
  );
}
