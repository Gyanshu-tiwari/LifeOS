import React from 'react';
import { X, CheckCircle, Clock, Cpu, ArrowRight } from 'lucide-react';
import { AgentInfo } from '../../types';

interface AgentModalProps {
  agent: AgentInfo | null;
  onClose: () => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ agent, onClose }) => {
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft-sm"
              style={{ backgroundColor: agent.colorScheme.bg }}
            >
              <Cpu className="w-5 h-5" style={{ color: agent.colorScheme.accent }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">{agent.name}</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">{agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Action */}
        <div className="mt-4 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" /> Current Activity
          </div>
          <p className="text-sm font-medium text-slate-800">
            {agent.currentAction || agent.description}
          </p>
        </div>

        {/* Coordinated Architecture Trace */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Multi-Agent State & Workflow
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Goal Ingestion:</span> Constraints verified (₹15,000 budget, ≤45m commute).
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Cross-Agent Synchronization:</span> Linked with Maps & Document Agents.
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Next Action:</span> Preparing plan refinement once Income Certificate is uploaded.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E60F2] text-white text-xs font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Assign Task to {agent.shortName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
