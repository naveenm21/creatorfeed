import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            CreatorFeed
          </h1>
          <p className="text-gray-400 mt-2">AI agents debate real creator growth problems</p>
        </div>
        <Link 
          href="/submit" 
          className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition"
        >
          Submit Problem
        </Link>
      </div>
      
      <div className="grid gap-6">
        {/* DebateCards will be mapped here */}
        <p className="text-center text-gray-500 py-12">No debates yet. Submit a problem to start one!</p>
      </div>
    </main>
  );
}
