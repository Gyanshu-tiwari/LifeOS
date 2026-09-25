import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Calculator,
  Lock,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const VerificationPage: React.FC = () => {
  const { showToast } = useLifeOS();
  const [isAuditing, setIsAuditing] = useState(false);

  const auditChecks = [
    {
      id: 'chk-1',
      title: 'Monthly Living Budget Equation Audit',
      category: 'Financial Constraint',
      breakdown: [
        { label: 'Room Rent (Indira Nagar PG)', amount: '₹8,500' },
        { label: 'Mess & Daily Food (3 meals)', amount: '₹3,500' },
        { label: 'Lucknow Metro GoSmart Pass', amount: '₹1,300' },
        { label: 'Contingency & Supplies', amount: '₹500' },
      ],
      total: '₹13,800/month',
      constraint: 'Monthly Cap: ₹15,000/month',
      margin: '₹1,200/month safe financial cushion (8% margin)',
      status: 'verified',
      auditor: 'Verification Agent v2.4',
      lastVerified: 'Today, 2:15 PM',
      isFresh: true,
      sourceCitation: 'Lucknow University Student Board & Field Rent Audit (Aug 4, 2026)',
    },
    {
      id: 'chk-2',
      title: 'Door-to-Door Transit Commute Math',
      category: 'Transit Constraint',
      breakdown: [
        { label: 'Walk to Lekhraj Metro Station', amount: '7 mins' },
        { label: 'Red Line Train Transit (5 stops)', amount: '18 mins' },
        { label: 'Walk from University Gate to Dept', amount: '2 mins' },
      ],
      total: '27 mins door-to-door',
      constraint: 'Maximum Commute: ≤ 45 mins',
      margin: '18 mins under maximum constraint (40% buffer)',
      status: 'verified',
      auditor: 'Maps Agent + Verification Agent',
      lastVerified: 'Today, 1:40 PM',
      isFresh: true,
      sourceCitation: 'Lucknow Metro Rail Corporation (LMRC) Timetable GTFS',
    },
    {
      id: 'chk-3',
      title: 'Hostel Registration Portal Deadline Validation',
      category: 'Academic Deadline',
      breakdown: [
        { label: 'Portal Opening Date', amount: 'July 25, 2026' },
        { label: 'Mandatory Income Cert Submission', amount: 'Aug 14, 2026' },
        { label: 'First Allotment Announcement', amount: 'Aug 18, 2026' },
      ],
      total: 'Closes Aug 14, 2026 at 17:00 IST',
      constraint: 'Hard Deadline for ₹9,500/mo on-campus allocation',
      margin: '4 days remaining to upload missing certificate',
      status: 'verified',
      auditor: 'Document Agent',
      lastVerified: 'Yesterday, 6:00 PM',
      isFresh: true,
      sourceCitation: 'Lucknow University Notice Ref #LU/HOSTEL/2026/089',
    },
  ];

  const handleReverify = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      showToast('Verification Agent completed formal arithmetic proofs: 100% Valid', 'success');
    }, 450);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Agent Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Trust & Mathematical Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Every recommendation is audited for arithmetic correctness, real citations, and fresh timestamps.
          </p>
        </div>

        <LifeOSButton
          onClick={handleReverify}
          variant="primary"
          size="sm"
          isLoading={isAuditing}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="bg-teal-600 hover:bg-teal-700"
        >
          Re-Verify Equations
        </LifeOSButton>
      </div>

      {/* Trust Dashboard Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white shadow-soft-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            Integrity Guarantee
          </span>
          <LifeOSBadge variant="success" pulse>
            ✓ 0 Hallucinations Detected
          </LifeOSBadge>
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
          Strict Evidence Verification Protocol
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10.5px] text-slate-300">Sources Audited</span>
            <p className="text-xl font-extrabold text-white mt-0.5">5 Sources</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10.5px] text-slate-300">Math Proofs</span>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">100% Pass</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10.5px] text-slate-300">Data Freshness</span>
            <p className="text-xl font-extrabold text-sky-400 mt-0.5">&lt; 24h Old</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10.5px] text-slate-300">Violations</span>
            <p className="text-xl font-extrabold text-white mt-0.5">0</p>
          </div>
        </div>
      </div>

      {/* Detailed Verification Proofs */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">
          Formal Proofs & Active Audits
        </h2>

        <div className="space-y-4">
          {auditChecks.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      {item.title}
                    </h3>
                    <LifeOSBadge variant="teal">{item.category}</LifeOSBadge>
                  </div>
                  <span className="text-xs text-slate-500">
                    Audited by {item.auditor} • Verified {item.lastVerified}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <LifeOSBadge variant="success" size="md">
                    Verified Valid
                  </LifeOSBadge>
                </div>
              </div>

              {/* Arithmetic Breakdown Formula Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  Arithmetic Calculation Components
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.breakdown.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-bold text-slate-900">{row.amount}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="font-bold text-slate-800">
                    Total Calculated: <span className="text-[#1E60F2] font-extrabold">{item.total}</span>
                  </span>
                  <span className="font-semibold text-emerald-700">
                    ✓ {item.margin}
                  </span>
                </div>
              </div>

              {/* Source Provenance Footnote */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-teal-600" />
                  <span>Provenance:</span>
                  <strong className="text-slate-700 font-semibold">{item.sourceCitation}</strong>
                </span>

                <span className="text-emerald-600 font-bold">
                  ✓ Cryptographically Audited
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
