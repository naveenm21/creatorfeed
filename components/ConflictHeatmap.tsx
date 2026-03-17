'use client';

import { AGENT_COLORS } from '@/lib/agents';

type AgentResponse = {
  id: string;
  agent_name: string;
  round_number: number;
  response_order: number;
  response_text: string;
  position: string | null;
  is_final_position: boolean;
};

interface ConflictHeatmapProps {
  responses: AgentResponse[];
  onNavigate?: (responseId: string) => void;
}

export function ConflictHeatmap({ responses, onNavigate }: ConflictHeatmapProps) {
  if (!responses || responses.length === 0) return null;

  // Map positions to heat scores
  const getHeatValue = (position: string | null) => {
    switch (position) {
      case 'disagree': return 100;
      case 'partial': return 50;
      case 'agree': return 10;
      default: return 5;
    }
  };

  return (
    <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 mb-8 overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] uppercase tracking-widest font-bold text-secondary">Conflict Heatmap — Pulse</span>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-tertiary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500/40" /> Agreement
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Hot Conflict
          </div>
        </div>
      </div>

      <div className="relative h-[80px] flex items-end gap-[2px]">
        {responses.map((resp, i) => {
          const heat = getHeatValue(resp.position);
          const color = AGENT_COLORS[resp.agent_name as keyof typeof AGENT_COLORS] || '#FFF';
          
          return (
            <button
              key={resp.id}
              onClick={() => onNavigate?.(resp.id)}
              className="flex-1 relative group/bar transition-all duration-300 hover:scale-y-110"
              style={{ height: `${20 + (heat * 0.6)}%` }}
            >
              {/* Bar */}
              <div 
                className={`w-full h-full rounded-t-sm transition-all duration-500 ${
                  resp.position === 'disagree' ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]' :
                  resp.position === 'partial' ? 'bg-gradient-to-t from-orange-600 to-orange-400' :
                  'bg-white/10'
                }`}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-black/90 border border-white/10 backdrop-blur-md opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50 min-w-[120px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-white">{resp.agent_name}</span>
                </div>
                <p className="text-[10px] text-secondary line-clamp-2 leading-relaxed">
                  {resp.response_text}
                </p>
                <div className="mt-1 text-[9px] uppercase font-black tracking-tighter" style={{ color: resp.position === 'disagree' ? '#f87171' : resp.position === 'partial' ? '#fb923c' : '#9ca3af' }}>
                  {resp.position || 'Neutral'}
                </div>
              </div>

              {/* Peak Indicator */}
              {resp.position === 'disagree' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Background Grid Lines */}
      <div className="absolute inset-x-6 bottom-6 h-[80px] -z-10 flex flex-col justify-between pointer-events-none opacity-20">
        <div className="w-full h-px bg-white/10" />
        <div className="w-full h-px bg-white/5" />
        <div className="w-full h-px bg-white/5" />
      </div>
    </div>
  );
}
