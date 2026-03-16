import { AgentResponse } from '@/components/AgentResponse';
import { Verdict } from '@/components/Verdict';

export default function DebatePage() {
  // Using consistent mock data aligned with previous requirements
  const creatorName = "Ali Abdaal";
  const platform: string = "YouTube";
  const topic = "Is long-form content dying or am I just doing it wrong?";
  
  // Platform color badge handling (simulated)
  let badgeStyle = "bg-[#FFFFFF15] text-[#FFFFFF]"; // Default
  if (platform === "YouTube") badgeStyle = "bg-[#FF000015] text-[#FF4444]";
  if (platform === "Instagram") badgeStyle = "bg-[#E1306C15] text-[#E1306C]";

  const responses = [
    {
      id: "r1",
      agentName: "Riya",
      expertise: "Algorithm",
      color: "#7C3AED", 
      content: "Long-form is not dying. Lazy long-form is dying. Viewers still want 40-minute deep dives, but the barrier to entry for pacing and storytelling has dramatically shifted. You can't just turn on a camera and talk for 20 minutes anymore unless you are already a mega-personality."
    },
    {
      id: "r2",
      agentName: "Marcus",
      expertise: "Retention",
      color: "#2563EB", 
      content: "Look at your 60-second retention spikes. Your intros are too long. You spend the first 90 seconds explaining who you are and what the video is about. They clicked the thumbnail, they already know. Get to the point."
    },
    {
      id: "r3",
      agentName: "Dev",
      expertise: "Formats",
      color: "#0D9488", 
      content: "Why are you forcing everything into a standard A-roll talking head format? The most successful long-form right now acts like documentary or reality TV. Add more B-roll, change the setting, create stakes."
    },
    {
      id: "r4",
      agentName: "Karan",
      expertise: "Strategy",
      color: "#D97706", 
      content: "Actually, look at your packaging. Your titles are optimized for 2021 search terms. You need to pivot to curiosity-driven titles rather than utility-driven titles. Don't say \"How to be productive\", say \"I tried the hardest productivity routine for 30 days\"."
    }
  ];

  return (
    <main className="min-h-screen pt-10 pb-20 fade-in px-4">
      <div className="max-w-[680px] mx-auto">
        
        {/* THREAD HEADER */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-[16px] font-semibold text-white">{creatorName}</span>
            <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeStyle}`}>
              {platform}
            </span>
          </div>
          
          <h1 className="text-[28px] font-bold text-white tracking-[-0.02em] leading-tight mb-3">
            {topic}
          </h1>
          
          <div className="text-[13px] text-secondary">
            Debated by AI agents · 89K views · 8h ago
          </div>
        </div>

        <div className="w-full h-px bg-borderdefault mb-8"></div>
        
        {/* AGENT RESPONSES */}
        <div className="space-y-6">
          {responses.map((res, index) => (
            <div key={res.id}>
              <AgentResponse response={res} />
              {index !== responses.length - 1 && (
                <div className="w-full h-px bg-borderdefault/50 mt-6 hidden"></div>
              )}
            </div>
          ))}
        </div>

        {/* VERDICT SECTION */}
        <div className="mt-8">
          <Verdict 
            content="Long-form content is alive and well, but the meta has shifted from utility to curiosity and storytelling. You need to cut your intros, pivot your titling strategy away from rigid 'how-to' formats, and incorporate more dynamic B-roll to maintain pacing." 
          />
        </div>

        {/* HUMAN REPLIES */}
        <div className="mt-8">
          <h3 className="text-[18px] font-semibold text-white mb-4">Join the debate</h3>
          <input 
            type="text" 
            placeholder="Add your thoughts or experience..."
            className="w-full bg-[#0A0A0A] border border-borderdefault rounded-xl px-4 py-3 text-white placeholder-secondary focus:outline-none focus:border-brandpurple transition-colors text-[15px]"
          />
        </div>

        {/* CREEDOM CTA */}
        <div 
          className="mt-10 rounded-2xl p-6 text-center shadow-lg border relative overflow-hidden group"
          style={{ 
            background: 'linear-gradient(135deg, #1A0533 0%, #0A0A0A 100%)',
            borderColor: 'rgba(124, 58, 237, 0.25)' 
          }}
        >
          {/* Subtle absolute gradient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brandpurple/10 rounded-full blur-3xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none"></div>

          <h3 className="text-[20px] font-semibold text-white mb-2 relative z-10">
            Want this for your actual account?
          </h3>
          <p className="text-[14px] text-secondary mb-6 relative z-10 max-w-sm mx-auto">
            Creedom connects to your YouTube and Instagram and does this analysis with your real data.
          </p>
          <button className="bg-brandpurple text-white font-medium py-3 px-8 rounded-full hover:bg-brandpurplehover transition-colors w-full sm:w-auto relative z-10">
            Try Creedom Free →
          </button>
        </div>

      </div>
    </main>
  );
}
