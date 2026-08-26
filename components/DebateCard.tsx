import Link from 'next/link';
import Image from 'next/image';
import { AGENT_AVATARS, AgentName } from '@/lib/agents';

export function DebateCard({ debate }: { debate: { id: string, creatorName: string, platform: string, timePosted: string, title: string, preview: string, agents: string[], agentCount: number, replies: number, humanReplies: number, views: string, slug?: string } }) {
  // Map platform to pill styles
  let badgeStyle = "bg-primary/10 text-primary border-primary/20"; // TikTok/Default
  if (debate.platform === "YouTube") badgeStyle = "bg-red-soft text-red border-red/20";
  if (debate.platform === "Instagram") badgeStyle = "bg-pink-soft text-brandprimary border-brandprimarysubtle";
  if (debate.platform === "Twitch") badgeStyle = "bg-purple-100 text-purple-600 border-purple-200";

  return (
    <div className="bg-card border border-borderdefault rounded-[24px] p-6 mb-4 shadow-[var(--rest-shadow)] hover:shadow-[var(--float-shadow)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group relative">
      <Link href={`/debate/${debate.slug || debate.id}`} className="block">
        {/* ROW 1: Creator line */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-[14px] font-bold text-primary leading-tight">{debate.creatorName}</span>
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-[999px] ${badgeStyle} border`}>
              {debate.platform}
            </span>
          </div>
          <span className="text-[13px] text-secondary font-medium">{debate.timePosted}</span>
        </div>

        {/* ROW 2: Debate topic */}
        <h2 className="text-[20px] font-display font-bold text-primary mt-1 line-clamp-2 leading-snug tracking-tight group-hover:text-brandprimary transition-colors">
          {debate.title}
        </h2>

        {/* ROW 3: Agent response preview */}
        <p className="text-[15px] text-secondary mt-3 line-clamp-2 leading-relaxed">
          {debate.preview}
        </p>

        {/* ROW 4: Bottom action row */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-borderdefault/50">
          <div className="flex items-center space-x-4">
            {debate.agents && debate.agents.length > 0 ? (
              <div className="flex -space-x-2">
                {debate.agents.slice(0, 3).map((agent: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-card bg-borderdefault z-10 relative overflow-hidden shadow-sm"
                    style={{ zIndex: 10 - idx }}
                  >
                    <Image
                      src={AGENT_AVATARS[agent as AgentName] || AGENT_AVATARS.Specialist} 
                      alt={`${agent} - AI Creator Growth Specialist`}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex items-center space-x-3 text-secondary text-[12px] font-bold uppercase tracking-wider">
              <span>{debate.agentCount} Agents</span>
              <span className="w-1 h-1 rounded-full bg-borderhover" />
              <span>{debate.replies} Replies</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center font-bold text-secondary text-[13px] group-hover:text-primary transition-colors">
              <svg className="w-5 h-5 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {debate.views}
            </div>
            <span className="flex items-center text-brandprimary text-[14px] font-bold hover:text-brandprimaryhover group-hover:underline">
              Join Debate <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}


