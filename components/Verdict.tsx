export function Verdict({ 
  content, 
  agentCount
}: { 
  content: string, 
  agentCount: number
}) {
  // Parse for disclaimer and reference links
  let mainContent = content;
  let disclaimer = "";
  let referenceLinks: string[] = [];

  const disclaimerMatch = content.match(/DISCLAIMER:[\s\S]*?(?=\n\nReference Links:|$)/);
  if (disclaimerMatch) {
    disclaimer = disclaimerMatch[0].trim();
    mainContent = mainContent.replace(disclaimerMatch[0], "").trim();
  }

  const linksMatch = content.match(/Reference Links:\n([\s\S]*)/);
  if (linksMatch) {
    referenceLinks = linksMatch[1].split("\n").filter(l => l.trim() !== "");
    mainContent = mainContent.replace(/Reference Links:\n[\s\S]*/, "").trim();
  }

  return (
    <div className="bg-[#1A1A1B] border rounded-xl border-[#343536] relative p-5 overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF4500]"></div>
      
      <div className="mb-4 mt-1 flex items-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500] shadow-[0_0_8px_#FF4500] animate-pulse" />
        <span className="text-[12px] font-black text-[#D7DADC] uppercase tracking-widest">
          The Verdict
        </span>
      </div>
      
      <div className="text-[15px] font-bold text-white leading-relaxed whitespace-pre-wrap mb-5">
        {mainContent}
      </div>

      {disclaimer && (
        <div className="mb-5 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-[12px] text-red-400 font-medium leading-relaxed italic">
            {disclaimer}
          </p>
        </div>
      )}

      {referenceLinks.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-[#818384] uppercase tracking-wider mb-2">Sources</h4>
          <ul className="space-y-1">
            {referenceLinks.map((link, i) => {
              const hasUrl = link.includes(': ');
              const title = hasUrl ? link.split(': ')[0] : link;
              const url = hasUrl ? link.split(': ')[1] : null;
              
              return (
                <li key={i} className="text-[13px] text-[#FF4500] font-bold hover:underline underline-offset-4">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {title}
                    </a>
                  ) : (
                    <span>{title}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="text-[11px] font-bold text-[#818384] uppercase tracking-tight border-t border-[#343536] pt-4">
        Synthesized from {agentCount} positions
      </div>
    </div>

  );
}
