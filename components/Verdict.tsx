export function Verdict({ content }: { content: string }) {
  return (
    <div className="p-8 rounded-xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30">
      <h3 className="text-xl font-bold mb-4 text-white">Final Verdict</h3>
      <div className="text-gray-200 whitespace-pre-wrap">{content}</div>
    </div>
  );
}
