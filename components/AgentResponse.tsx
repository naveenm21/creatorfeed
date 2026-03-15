import { AgentMessage } from '@/types';

export function AgentResponse({ message }: { message: AgentMessage }) {
  return (
    <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
      <div className="font-bold text-sm mb-4 text-purple-400">{message.agentName}</div>
      <div className="text-gray-300 whitespace-pre-wrap">{message.content}</div>
    </div>
  );
}
