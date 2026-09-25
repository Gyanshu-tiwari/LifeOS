import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Cpu,
  Globe,
  Sliders,
  CheckCircle2,
  Save,
  Database,
  Trash2,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const SettingsPage: React.FC = () => {
  const { user, connectionStatus, showToast } = useLifeOS();

  const [aiAutonomousLevel, setAiAutonomousLevel] = useState<'always_ask' | 'safe_only' | 'high_trust'>(
    user.preferences.autonomousLevel
  );
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyAgentActions, setNotifyAgentActions] = useState(true);
  const [connectedCalendar, setConnectedCalendar] = useState(true);
  const [connectedDigiLocker, setConnectedDigiLocker] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Settings & AI autonomy levels saved successfully', 'success');
    }, 300);
  };

  const handlePurgeMemory = () => {
    showToast('Agent session cache and memory purged for active goals', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Configuration & Autonomy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          System Settings & AI Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure multi-agent autonomy thresholds, notification alerts, and external service bindings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Backend & Gateway Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">
                Backend Service & WebSocket Gateway
              </h2>
            </div>
            <LifeOSBadge variant={connectionStatus === 'connected' ? 'success' : 'warning'} pulse>
              {connectionStatus === 'connected' ? 'Gateway Connected' : 'Connecting Gateway'}
            </LifeOSBadge>
          </div>
          <p className="text-xs text-slate-500">
            Frontend is connected via clean service abstraction (`src/api/services/*`). Toggle between mock development data and production REST/WebSocket endpoints via environment variables.
          </p>
        </div>

        {/* Section 1: AI Agent Autonomy & Guardrails */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#1E60F2]" />
            <h2 className="text-base font-bold text-slate-800">
              Agent Autonomy & Execution Threshold
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Define how much authority the Action Agent and Orchestrator have when executing real-world actions.
          </p>

          <div className="space-y-3 pt-2">
            {[
              {
                id: 'always_ask',
                title: 'Always Ask (Maximum Supervision)',
                desc: 'Prompt user confirmation for every single task, search query, and calendar entry.',
              },
              {
                id: 'safe_only',
                title: 'Safe Actions Autonomous (Recommended)',
                desc: 'Research, route calculation, and draft preparation run automatically. Real bookings, form submissions, and external actions require approval.',
              },
              {
                id: 'high_trust',
                title: 'High Autonomy (Power Mode)',
                desc: 'Agents execute low-risk reservations and document verifications automatically within strict budget boundaries.',
              },
            ].map((option) => (
              <label
                key={option.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  aiAutonomousLevel === option.id
                    ? 'bg-blue-50/60 border-[#1E60F2] ring-2 ring-blue-500/10'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="autonomy"
                  value={option.id}
                  checked={aiAutonomousLevel === option.id}
                  onChange={() => setAiAutonomousLevel(option.id as any)}
                  className="mt-1 text-[#1E60F2] focus:ring-[#1E60F2]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {option.title}
                  </span>
                  <span className="text-[11.5px] text-slate-500 mt-0.5 block leading-relaxed">
                    {option.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Connected Services */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              Connected External Services
            </h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Google Calendar & Reminders</span>
                <span className="text-slate-500">Syncs hostel deadlines, travel milestones, and orientations</span>
              </div>
              <input
                type="checkbox"
                checked={connectedCalendar}
                onChange={(e) => setConnectedCalendar(e.target.checked)}
                className="w-4 h-4 text-[#1E60F2] rounded focus:ring-[#1E60F2]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">DigiLocker / eDistrict UP Portal</span>
                <span className="text-slate-500">Automates verified Aadhaar and Income Certificate fetching</span>
              </div>
              <input
                type="checkbox"
                checked={connectedDigiLocker}
                onChange={(e) => setConnectedDigiLocker(e.target.checked)}
                className="w-4 h-4 text-[#1E60F2] rounded focus:ring-[#1E60F2]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Alerts */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="font-bold text-slate-800">Deadline & Cutoff Reminders (24h in advance)</span>
              <input
                type="checkbox"
                checked={notifyDeadlines}
                onChange={(e) => setNotifyDeadlines(e.target.checked)}
                className="w-4 h-4 text-[#1E60F2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="font-bold text-slate-800">Agent Status Updates & Discovered Options</span>
              <input
                type="checkbox"
                checked={notifyAgentActions}
                onChange={(e) => setNotifyAgentActions(e.target.checked)}
                className="w-4 h-4 text-[#1E60F2] rounded"
              />
            </label>
          </div>
        </div>

        {/* Section 4: Privacy & Agent Memory Purge */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              Data Privacy & Local Storage
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Control persistent goal memory, temporary document caches, and audit logs.
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs">
            <div>
              <span className="font-bold text-rose-900 block">Purge Agent Memory Cache</span>
              <span className="text-rose-700">Deletes temporary intermediate reasoning traces for active goals</span>
            </div>
            <LifeOSButton
              type="button"
              onClick={handlePurgeMemory}
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
            >
              Purge Cache
            </LifeOSButton>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <LifeOSButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Preferences
          </LifeOSButton>
        </div>
      </form>
    </div>
  );
};
