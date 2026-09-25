import React from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Calendar,
  XCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';

export const ActionCenterPage: React.FC = () => {
  const { actions, approveAction, rejectAction } = useLifeOS();

  const pendingActions = actions.filter((a) => a.status === 'pending');
  const pastActions = actions.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" />
          <span>Action Agent Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          Consequential Action Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          LIFEOS never executes high-impact or irreversible real-world actions without explicit user approval.
        </p>
      </div>

      {/* Safety Protocol Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-soft-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            Zero Silent Execution Guarantee
          </span>
          <LifeOSBadge variant="success">Cryptographically Guardrailed</LifeOSBadge>
        </div>

        {/* 5-Step Visual Pipeline */}
        <div className="py-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Step 1</span>
              <span className="font-bold text-white mt-0.5 block">AI Recommendation</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Step 2</span>
              <span className="font-bold text-white mt-0.5 block">Evidence Verification</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Step 3</span>
              <span className="font-bold text-white mt-0.5 block">Impact Assessment</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/15 border border-rose-400/40 ring-2 ring-rose-400/20">
              <span className="text-[10px] text-rose-300 uppercase block font-bold">Step 4</span>
              <span className="font-bold text-rose-300 mt-0.5 block">User Authorization</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Step 5</span>
              <span className="font-bold text-white mt-0.5 block">Execution & Audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions Requiring User Authorization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            Pending Actions Requiring Approval ({pendingActions.length})
          </h2>
          <LifeOSBadge variant="warning" pulse>
            Awaiting Signature
          </LifeOSBadge>
        </div>

        {pendingActions.length === 0 ? (
          <LifeOSEmptyState
            icon={CheckCircle2}
            title="All clear! No actions pending signature."
            description="Agents are operating within verified parameters. Any external commitments will appear here for your sign-off."
          />
        ) : (
          <div className="space-y-4">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-rose-200/90 shadow-soft hover:shadow-soft-md transition-all space-y-4 ring-2 ring-rose-500/10"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase mb-2 inline-block">
                      Consequential Real-World Action
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <LifeOSBadge variant="warning" pulse>
                    Pending Signature
                  </LifeOSBadge>
                </div>

                {/* Evidence & Consequence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase block">
                      Evidence & Legal Policy Basis
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {action.evidence}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                    <span className="text-[10.5px] font-bold text-rose-700 uppercase block">
                      Consequences & Irreversibility
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {action.consequence}
                    </p>
                  </div>
                </div>

                {/* Decision Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <LifeOSButton
                    onClick={() => rejectAction(action.id)}
                    variant="outline"
                    size="sm"
                  >
                    Reject / Cancel Action
                  </LifeOSButton>
                  <LifeOSButton
                    onClick={() => approveAction(action.id)}
                    variant="success"
                    size="md"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Authorize & Execute Action
                  </LifeOSButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Execution History Log */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">
          Action Execution Audit Log
        </h2>

        <div className="space-y-3">
          {pastActions.map((action) => (
            <div
              key={action.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3.5">
                {action.status === 'executed' || action.status === 'approved' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{action.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{action.consequence}</p>
                </div>
              </div>

              <LifeOSBadge
                variant={action.status === 'executed' || action.status === 'approved' ? 'success' : 'danger'}
              >
                {action.status}
              </LifeOSBadge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
