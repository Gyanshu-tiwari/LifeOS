import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  Bot,
  Search,
  MapPin,
  FileCheck2,
  CalendarCheck,
  ShieldCheck,
  Zap,
  Activity,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { AgentInfo, AgentType } from '../types';
import { AgentModal } from '../components/dashboard/AgentModal';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const AgentsPage: React.FC = () => {
  const { agents, showToast } = useLifeOS();
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'orchestrator':
        return <Layers className="w-5 h-5 text-indigo-600" />;
      case 'research':
        return <Search className="w-5 h-5 text-purple-600" />;
      case 'maps':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'documents':
        return <FileCheck2 className="w-5 h-5 text-amber-600" />;
      case 'planning':
        return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
      case 'verification':
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
      case 'action':
        return <Zap className="w-5 h-5 text-rose-600" />;
      default:
        return <Bot className="w-5 h-5 text-slate-600" />;
    }
  };

  const activityTimeline = [
    {
      time: '10:42',
      agent: 'Research Agent',
      action: 'Research Agent started market sweep for Lucknow University vicinity',
      type: 'research',
      icon: Search,
      color: 'text-purple-600',
    },
    {
      time: '10:43',
      agent: 'Research Agent',
      action: 'Identified 12 verified housing options in Indira Nagar & Gomti Nagar',
      type: 'research',
      icon: Search,
      color: 'text-purple-600',
    },
    {
      time: '10:44',
      agent: 'Maps Agent',
      action: 'Calculated door-to-door commute: 25 min via Red Line Metro (≤ 45 min constraint PASS)',
      type: 'maps',
      icon: MapPin,
      color: 'text-blue-600',
    },
    {
      time: '10:45',
      agent: 'Verification Agent',
      action: 'Mathematically audited monthly burn: ₹13,800/mo meets ₹15,000/mo cap',
      type: 'verification',
      icon: ShieldCheck,
      color: 'text-teal-600',
    },
    {
      time: '10:46',
      agent: 'Planning Agent',
      action: 'Generated 4-phase relocation plan targeting Aug 25 arrival deadline',
      type: 'planning',
      icon: CalendarCheck,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Multi-Agent Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            AI Agent Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Specialized agent fleet executing coordinated goal tasks in parallel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LifeOSBadge variant="success" pulse size="md">
            7 Agents Online & Synchronized
          </LifeOSBadge>
          <LifeOSButton
            onClick={() => showToast('Dispatched health ping to all 7 agents: 100% OK', 'success')}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Ping Fleet
          </LifeOSButton>
        </div>
      </div>

      {/* Orchestration Workflow Pipeline Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-soft-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Active Execution Pipeline</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            Orchestrator v2.4 Active
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
          Understand → Research → Reason → Verify → Plan → Act → Remember
        </h2>

        {/* Coordinated Step Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {[
            { name: 'Orchestrator', desc: 'Syncing Goal' },
            { name: 'Research', desc: 'PGs Found' },
            { name: 'Maps', desc: '25m Commute' },
            { name: 'Documents', desc: 'Cert Missing' },
            { name: 'Planning', desc: 'Plan Staged' },
            { name: 'Verification', desc: '₹13.8k ≤ ₹15k' },
            { name: 'Action', desc: 'Hostel Draft' },
          ].map((step, idx) => (
            <div
              key={step.name}
              className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center flex flex-col justify-between"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Step 0{idx + 1}
              </span>
              <p className="text-xs font-bold text-white mt-1">{step.name}</p>
              <span className="mt-2 text-[10.5px] font-bold text-sky-300 bg-white/10 py-0.5 px-1.5 rounded-md">
                {step.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Agent Cards Grid (7 of 12 cols) + Real-Time Activity Timeline (5 of 12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Agents Fleet Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            Active Agent Fleet ({agents.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div>
                  {/* Header: Icon, Name & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft-sm"
                      style={{ backgroundColor: agent.colorScheme.bg }}
                    >
                      {getAgentIcon(agent.type)}
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border flex items-center gap-1.5"
                      style={{
                        backgroundColor: agent.colorScheme.badgeBg,
                        color: agent.colorScheme.badgeText,
                        borderColor: agent.colorScheme.border,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: agent.colorScheme.accent }}
                      />
                      {agent.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1E60F2] transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {agent.role}
                  </p>

                  {/* Current Activity */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Current Execution
                    </span>
                    <p className="font-medium line-clamp-2">
                      {agent.currentAction || agent.description}
                    </p>
                  </div>
                </div>

                {/* Footer / Last Execution */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {agent.lastExecution || 'Active'}
                  </span>
                  <span className="text-[#1E60F2] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Inspect Trace →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Activity Timeline (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1E60F2]" />
              <span>Real-Time Activity Timeline</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Stream
            </span>
          </div>

          <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 ml-2">
            {activityTimeline.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative space-y-1">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#1E60F2] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2]" />
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-400 text-[11px]">
                      {item.time}
                    </span>
                    <span className={`font-bold text-[11px] ${item.color}`}>
                      {item.agent}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AgentModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};
