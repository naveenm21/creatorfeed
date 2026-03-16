export function Verdict({ content }: { content: string }) {
  return (
    <div className="bg-[#0A0A0A] border rounded-r-xl border-borderdefault border-l-0 relative p-5 pl-6">
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gold rounded-l-md"></div>
      
      <div className="mb-2">
        <span className="text-[12px] font-medium text-gold uppercase tracking-[0.05em]">
          The Verdict
        </span>
      </div>
      
      <div className="text-[16px] font-medium text-white leading-[1.7] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
