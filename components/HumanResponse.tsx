export function HumanResponse({ response }: { 
  response: { userName: string, isCreator: boolean, content: string, likes: number } 
}) {
  const initial = response.userName.charAt(0);

  return (
    <div className="relative flex">
      {/* Left Teal Border */}
      <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-teal-500"></div>
      
      <div className="flex-grow w-full pl-4">
        {/* Header row: Avatar + Name + Expertise */}
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[16px] flex-shrink-0 bg-teal-900 border border-teal-500/50">
            {initial}
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[15px] text-primary">{response.userName}</span>
            {response.isCreator && (
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider bg-teal-900/30 px-1.5 py-0.5 rounded border border-teal-500/30">
                Creator
              </span>
            )}
          </div>
        </div>
        
        {/* Response Body */}
        <div className="text-[15px] text-primary leading-[1.7] whitespace-pre-wrap ml-[52px]">
          {response.content}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center space-x-6 mt-3 ml-[52px]">
          <button className="flex items-center text-secondary text-[13px] hover:text-primary transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-[#111] flex items-center justify-center -ml-2 mr-1 transition-colors">
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
            </div>
            {response.likes}
          </button>
          
          <button className="flex items-center text-secondary text-[13px] hover:text-primary transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-[#111] flex items-center justify-center -ml-2 transition-colors">
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </div>
          </button>
          
          <button className="flex items-center text-secondary text-[13px] hover:text-primary transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-[#111] flex items-center justify-center -ml-2 mr-1 transition-colors">
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </div>
            Reply
          </button>
          <button className="flex items-center text-secondary text-[13px] hover:text-ytred transition-colors group">
            <div className="w-8 h-8 rounded-full group-hover:bg-[#111] flex items-center justify-center -ml-2 mr-1 transition-colors">
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            </div>
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
