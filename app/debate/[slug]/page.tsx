export default function DebatePage({ params }: { params: { slug: string } }) {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debate: {params.slug}</h1>
      <div className="space-y-8">
        {/* AgentResponses and Verdict will go here */}
      </div>
    </main>
  );
}
