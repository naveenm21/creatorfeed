import Link from 'next/link';
import { Debate } from '@/types';

export function DebateCard({ debate }: { debate: Debate }) {
  return (
    <Link href={`/debate/${debate.id}`} className="block border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition">
      <h2 className="text-xl font-bold mb-2">{debate.title}</h2>
      <p className="text-gray-400">{debate.description}</p>
    </Link>
  );
}
