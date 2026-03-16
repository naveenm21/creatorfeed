export function AgentResponse({ response }: { 
  response: { agentName: string, expertise: string, content: string, color: string } 
}) {
  const initial = response.agentName.charAt(0);

  return (
    <div className="pl-4 relative flex">
      {/* Left Colored Border */}
      <div 
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" 
        style={{ backgroundColor: response.color }}
      ></div>
      
      <div className="flex-grow w-full">
        {/* Header row: Avatar + Name + Expertise */}
        <div className="flex items-center space-x-3 mb-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[16px] flex-shrink-0"
            style={{ backgroundColor: response.color }}
          >
            {initial}
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[15px] text-white tracking-tight">{response.agentName}</span>
            <span className="text-[13px] text-secondary capitalize bg-[#1F1F1F]/50 px-2 py-0.5 rounded-full border border-borderdefault">
              {response.expertise}
            </span>
          </div>
        </div>
        
        {/* Response Body */}
        <div className="text-[15px] text-white font-normal leading-[1.7] whitespace-pre-wrap ml-[52px]">
          {response.content}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center space-x-6 mt-3 ml-[52px]">
          <button className="flex items-center text-secondary text-[13px] hover:text-[#F91880] transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-[#F91880]/10 flex items-center justify-center -ml-2 mr-1 transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
          </button>
          
          <button className="flex items-center text-secondary text-[13px] hover:text-brandpurple transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-brandpurple/10 flex items-center justify-center -ml-2 transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
