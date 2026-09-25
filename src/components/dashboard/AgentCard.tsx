import React from 'react';
import {
  Search,
  MapPin,
  FileCheck2,
  CalendarCheck,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { AgentInfo, AgentType } from '../../types';

interface AgentCardProps {
  agent: AgentInfo;
  onClick?: (agent: AgentInfo) => void;
}

const getAgentIcon = (type: AgentType) => {
  switch (type) {
    case 'research':
      return <Search className="w-4 h-4 text-purple-600" />;
    case 'maps':
      return <MapPin className="w-4 h-4 text-blue-600" />;
    case 'documents':
      return <FileCheck2 className="w-4 h-4 text-amber-600" />;
    case 'planning':
      return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
    case 'verification':
      return <ShieldCheck className="w-4 h-4 text-teal-600" />;
    default:
      return <Bot className="w-4 h-4 text-indigo-600" />;
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  return (
    <div
      onClick={() => onClick && onClick(agent)}
      className="flex-shrink-0 w-[148px] p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-95"
    >
      <div>
        {/* Top Icon and Live Status Dot */}
        <div className="flex items-center justify-between mb-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-soft-sm"
            style={{ backgroundColor: agent.colorScheme.bg }}
          >
            {getAgentIcon(agent.type)}
          </div>

          {/* Active status pulse */}
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: agent.colorScheme.accent }}
            />
          </div>
        </div>

        {/* Agent Name */}
        <h4 className="text-[13.5px] font-bold text-slate-800 tracking-tight leading-snug">
          {agent.shortName}
        </h4>

        {/* Agent Description */}
        <p className="text-[11.5px] font-medium text-slate-500 mt-0.5 leading-tight line-clamp-2">
          {agent.description}
        </p>
      </div>

      {/* Unified Agent Badge */}
      {agent.badge && (
        <div
          className="mt-3 px-2 py-0.5 rounded-md text-[10px] font-semibold text-center truncate border"
          style={{
            backgroundColor: agent.colorScheme.badgeBg,
            color: agent.colorScheme.badgeText,
            borderColor: agent.colorScheme.border,
          }}
        >
          {agent.badge}
        </div>
      )}
    </div>
  );
};
