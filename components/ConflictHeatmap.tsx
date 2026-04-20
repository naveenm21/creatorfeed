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

  // Identify consensus shift (Turning Points)
  const turningPointIds = new Set<string>();
  const lastPosMap: Record<string, string> = {};
  responses.forEach(r => {
    if ((r.position === 'agree' || r.position === 'partial') && lastPosMap[r.agent_name] === 'disagree') {
      turningPointIds.add(r.id);
    }
    if (r.position && r.position !== 'none') lastPosMap[r.agent_name] = r.position;
  });

  const getHeatValue = (position: string | null) => {
    switch (position) {
      case 'disagree': return 100;
      case 'partial': return 50;
      case 'agree': return 10;
      default: return 5;
    }
  };

  return (
    <div className="w-full bg-[#1A1A1B] border border-[#343536] rounded-xl p-6 mb-10 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500] shadow-[0_0_8px_#FF4500] animate-pulse" />
          <span className="text-[12px] uppercase tracking-widest font-black text-[#D7DADC]">Consensus Pipeline</span>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[#818384]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF4500] shadow-[0_0_8px_rgba(255,69,0,0.5)]" /> Consensus Shift
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#343536]" /> Conflict
          </div>
        </div>
      </div>

      <div className="relative h-[80px] flex items-end gap-[3px]">
        {responses.map((resp) => {
          const heat = getHeatValue(resp.position);
          const color = AGENT_COLORS[resp.agent_name as keyof typeof AGENT_COLORS] || '#FFF';
          const isTurningPoint = turningPointIds.has(resp.id);
          
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
                  isTurningPoint ? 'bg-[#FF4500] shadow-[0_0_12px_rgba(255,69,0,0.4)]' :
                  resp.position === 'disagree' ? 'bg-[#343536]' :
                  'bg-white/10'
                }`}
              />
              
              {/* Turning Point Marker */}
              {isTurningPoint && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] shadow-[0_0_10px_#FF4500]" />
                  <div className="w-px h-2 bg-[#FF4500]" />
                </div>
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 rounded-xl bg-[#1A1A1B] border border-[#343536] shadow-2xl opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50 min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-white uppercase tracking-tight">{resp.agent_name}</span>
                </div>
                <p className="text-[11px] text-[#818384] line-clamp-3 leading-relaxed mb-2 italic">
                  &ldquo;{resp.response_text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isTurningPoint ? 'text-[#FF4500]' : 'text-[#818384]'}`}>
                    {isTurningPoint ? 'Turning Point' : resp.position || 'Neutral'}
                  </span>
                  <span className="text-[9px] text-[#444] font-bold">Rnd {resp.round_number}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

      
      {/* Background Grid Lines */}
      <div className="absolute inset-x-6 bottom-6 h-[80px] -z-10 flex flex-col justify-between pointer-events-none opacity-20">
        <div className="w-full h-px bg-white/10" />
        <div className="w-full h-px bg-white/5" />
        <div className="w-full h-px bg-white/5" />
      </div>
    </div>
  );
}
