import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Compass,
  ShieldCheck,
  Bot,
  Zap,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileText,
} from 'lucide-react';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const guideCards = [
    {
      icon: Compass,
      title: 'Creating & Managing Goals',
      desc: 'Learn how to define objectives, specify budget limits, and establish commute boundaries.',
      tag: 'Core Concept',
    },
    {
      icon: Bot,
      title: 'Multi-Agent Coordination',
      desc: 'Understand how Orchestrator, Research, Maps, and Planning agents cooperate in real time.',
      tag: 'Architecture',
    },
    {
      icon: ShieldCheck,
      title: 'Mathematical Proofs & Trust',
      desc: 'How Verification Agent validates arithmetic and timetable citations to prevent hallucinations.',
      tag: 'Verification',
    },
    {
      icon: Zap,
      title: 'Zero Silent Action Protocol',
      desc: 'Why LIFEOS requires explicit cryptographic authorization before consequential actions.',
      tag: 'Security',
    },
  ];

  const faqs = [
    {
      q: 'How does LIFEOS coordinate multiple AI agents?',
      a: 'The central Orchestrator Agent takes your high-level goal (e.g. "Move to Lucknow for college"), extracts mathematical constraints (₹15,000 budget, ≤45m commute, no vehicle), and delegates specialized tasks in parallel to the Research, Maps, Document, and Planning Agents.',
    },
    {
      q: 'Will LIFEOS ever book, submit, or spend money without my permission?',
      a: 'Never. LIFEOS operates under a strict "Zero Silent Consequential Action" principle. Actions that affect your calendar, money, bookings, or documents are staged for your explicit review and authorization in the Action Center.',
    },
    {
      q: 'How does the Verification Agent audit math and constraints?',
      a: 'The Verification Agent independently audits equations (Rent + Mess + Transit Pass ≤ Budget Cap) and ensures transit routes conform to Google Maps / OpenStreetMap timetable data before presenting a plan to you.',
    },
    {
      q: 'What is the persistent goal state?',
      a: 'Unlike traditional question-answer chatbots that forget past steps, LIFEOS maintains persistent state: what tasks have completed, which documents are missing, and what action should happen next.',
    },
    {
      q: 'How do I connect my real backend API?',
      a: 'Set VITE_API_MODE=real and VITE_API_URL=http://your-backend-host/api/v1. The frontend services in src/api/services/ will route requests to your real REST and WebSocket endpoints.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Documentation & Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          LIFEOS Help & Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Everything you need to know about the AI Operating System for real-world life.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, agent protocols, constraint math, or FAQs..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Guide Topic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guideCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all space-y-2.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center group-hover:bg-[#1E60F2] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <LifeOSBadge variant="primary" size="sm">
                  {card.tag}
                </LifeOSBadge>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-[#1E60F2] transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Core Workflow Architecture */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
        <h2 className="text-base font-bold text-[#0B192C]">
          The 7-Step Real-World Workflow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
            <span className="font-bold text-blue-700 block">1. Understand</span>
            <p className="text-slate-600 leading-relaxed">Extracts destination, budget cap, deadline, and vehicle constraints.</p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
            <span className="font-bold text-purple-700 block">2. Research & Maps</span>
            <p className="text-slate-600 leading-relaxed">Scans real PG accommodations, verified commute timetables, and local rules.</p>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1">
            <span className="font-bold text-teal-700 block">3. Verify & Reason</span>
            <p className="text-slate-600 leading-relaxed">Audits numbers: Rent + transit ≤ budget. Commute time ≤ 45 mins.</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <span className="font-bold text-emerald-700 block">4. Plan & Act</span>
            <p className="text-slate-600 leading-relaxed">Generates 4-phase plan; executes consequential steps upon user sign-off.</p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B192C]">
          Frequently Asked Questions ({filteredFaqs.length})
        </h2>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft cursor-pointer transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-[#1E60F2] font-black">Q:</span>
                    <span>{faq.q}</span>
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-180 text-[#1E60F2]' : ''
                    }`}
                  />
                </div>
                {isExpanded && (
                  <p className="text-xs sm:text-sm text-slate-600 pt-3 leading-relaxed border-t border-slate-100 mt-3 animate-fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
