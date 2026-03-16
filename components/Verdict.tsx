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
    <div className="bg-[#0A0A0A] border rounded-xl border-borderdefault relative p-5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gold"></div>
      
      <div className="mb-3 mt-1 flex items-center space-x-2">
        <svg className="w-4 h-4 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        <span className="text-[13px] font-bold text-white uppercase tracking-[0.05em]">
          The AI Verdict
        </span>
      </div>
      
      <div className="text-[15px] font-normal text-primary leading-[1.6] whitespace-pre-wrap mb-4">
        {mainContent}
      </div>

      {disclaimer && (
        <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-[12px] text-red-400 font-medium leading-relaxed italic">
            {disclaimer}
          </p>
        </div>
      )}

      {referenceLinks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[11px] font-bold text-tertiary uppercase tracking-wider mb-2">Reference Links</h4>
          <ul className="space-y-1">
            {referenceLinks.map((link, i) => {
              const hasUrl = link.includes(': ');
              const title = hasUrl ? link.split(': ')[0] : link;
              const url = hasUrl ? link.split(': ')[1] : null;
              
              return (
                <li key={i} className="text-[13px] text-brandprimary hover:underline underline-offset-4">
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

      <div className="text-[12px] text-tertiary border-t border-borderdefault pt-3">
        Synthesized from {agentCount} AI perspectives
      </div>
    </div>
  );
}
