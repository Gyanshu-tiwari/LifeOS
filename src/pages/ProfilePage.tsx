import React from 'react';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Target,
  CheckCircle2,
  Sparkles,
  Bot,
  Settings,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const ProfilePage: React.FC = () => {
  const { user, goals, tasks, documents } = useLifeOS();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const verifiedDocs = documents.filter((d) => d.status === 'verified').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-blue-500/20 shadow-md"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#0B192C]">
              {user.name}
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-[#1E60F2] text-xs font-bold border border-blue-100 self-center sm:self-auto">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Target: Lucknow, UP</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Identity Verified (Aadhaar UIDAI)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Goal Progress Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Goals</span>
          <p className="text-2xl font-extrabold text-[#1E60F2] mt-1">{goals.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">In Progress</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Tasks Completed</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {completedTasks} / {totalTasks}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {Math.round((completedTasks / totalTasks) * 100)}% Execution Rate
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Verified Documents</span>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
            {verifiedDocs} / {documents.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Document Agent Validated</span>
        </div>
      </div>

      {/* AI Agent Configuration & Persona */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
        <h2 className="text-base font-bold text-slate-800">
          Agentic AI Assistant Preferences
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Active Reasoning Model</span>
              <span className="text-slate-500">{user.preferences.aiModel}</span>
            </div>
            <span className="text-emerald-600 font-bold">Fast Tiered</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Autonomous Action Threshold</span>
              <span className="text-slate-500">
                Safe actions run autonomously; consequential bookings require cryptographic signature
              </span>
            </div>
            <span className="text-[#1E60F2] font-bold uppercase">Safe Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
