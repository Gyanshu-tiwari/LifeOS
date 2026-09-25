import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/dashboard/HeroSection';
import { GoalInput } from '../components/dashboard/GoalInput';
import { QuickActions } from '../components/dashboard/QuickActions';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { GoalCard } from '../components/dashboard/GoalCard';
import { TaskItem } from '../components/dashboard/TaskItem';
import { MotivationCard } from '../components/dashboard/MotivationCard';
import { AgentCard } from '../components/dashboard/AgentCard';
import { AgentModal } from '../components/dashboard/AgentModal';
import { QuickActionModal } from '../components/dashboard/QuickActionModal';
import { useLifeOS } from '../context/LifeOSContext';
import { AgentInfo } from '../types';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  AlertCircle,
  Clock,
  Compass,
  FileUp,
} from 'lucide-react';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSCard } from '../components/ui/LifeOSCard';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const HomePage: React.FC = () => {
  const {
    user,
    activeGoal,
    tasks,
    agents,
    actions,
    toggleTask,
    addGoal,
    showToast,
    approveAction,
    recentAgentActivity,
  } = useLifeOS();

  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

  // Active goal tasks
  const goalTasks = tasks.filter(
    (t) => !t.goalId || t.goalId === activeGoal.id
  );

  const pendingActions = actions.filter((a) => a.status === 'pending');

  const handleGoalSubmit = async (text: string) => {
    const newId = await addGoal({
      title: text,
      description: `User initiated goal: "${text}"`,
      location: 'Lucknow, UP',
      deadline: 'Dec 2026',
    });
    navigate(`/goals/${newId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Hero / Welcome Section */}
      <HeroSection userName={user.name} />

      {/* 2. AI Goal Input Command Bar */}
      <GoalInput onSubmitGoal={handleGoalSubmit} />

      {/* 3. Quick Actions 4-Column Grid */}
      <QuickActions
        onActionClick={(id) => {
          if (id === 'plan') navigate(`/goals/${activeGoal.id}/plan`);
          else if (id === 'research') navigate('/research');
          else if (id === 'take-action') navigate('/actions');
          else if (id === 'upload') navigate('/documents');
          else setActiveQuickAction(id);
        }}
      />

      {/* 4. Real-Time Multi-Agent Activity Ticker */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-soft-sm flex items-center justify-between gap-3 text-xs overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0 text-[#1E60F2] font-bold">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">Agent Stream:</span>
        </div>
        <div className="flex-1 truncate text-slate-600 font-medium">
          <span className="inline-block animate-fade-in truncate">
            {recentAgentActivity[0] || 'Orchestrator monitoring Lucknow relocation state'}
          </span>
        </div>
        <button
          onClick={() => navigate('/agents')}
          className="text-[11px] font-bold text-[#1E60F2] hover:underline flex-shrink-0 whitespace-nowrap"
        >
          View Center →
        </button>
      </div>

      {/* 5. Responsive Multi-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (7 of 12 columns on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prominent Next Best Action Banner */}
          {activeGoal.nextAction && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-indigo-500/10 border border-amber-300/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      What Should I Do Right Now?
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {activeGoal.nextAction}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Document Agent identified missing certificate required for college hostel fee subsidy before Aug 14.
                  </p>
                </div>
              </div>

              <LifeOSButton
                onClick={() => navigate('/documents')}
                variant="primary"
                size="sm"
                leftIcon={<FileUp className="w-4 h-4" />}
                className="whitespace-nowrap sm:self-center"
              >
                Upload Now
              </LifeOSButton>
            </div>
          )}

          {/* Featured Goal Section */}
          <section>
            <SectionHeader
              title="My Goals"
              actionText="View All →"
              onActionClick={() => navigate('/goals')}
            />
            <GoalCard
              goal={activeGoal}
              onClick={() => navigate(`/goals/${activeGoal.id}`)}
            />
          </section>

          {/* Today's Tasks Section */}
          <section>
            <SectionHeader
              title="Today's Priorities"
              actionText="View All Tasks →"
              onActionClick={() => navigate('/tasks')}
            />
            <div className="space-y-2.5">
              {goalTasks.slice(0, 3).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                />
              ))}
            </div>
          </section>

          {/* AI Agents Working for You */}
          <section>
            <SectionHeader
              title="AI Agents Working for You"
              actionText="View Operations Center →"
              onActionClick={() => navigate('/agents')}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {agents.slice(0, 5).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={(ag) => setSelectedAgent(ag)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right / Secondary Column (5 of 12 columns on large screens) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Goal Intelligence & Constraint Audit Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Goal Intelligence
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Active constraint tracking
                  </p>
                </div>
              </div>
              <LifeOSBadge variant="success" pulse>
                Optimal Math
              </LifeOSBadge>
            </div>

            <div className="mt-4 space-y-3">
              {/* Constraint item 1: Budget */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block">
                    Monthly Budget Cap
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Projected: ₹13,800 / ₹15,000
                  </span>
                </div>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>

              {/* Constraint item 2: Commute */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block">
                    Max Commute Time
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Verified: 25 mins ≤ 45 mins
                  </span>
                </div>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pass
                </span>
              </div>

              {/* Constraint item 3: Transit */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block">
                    Vehicle Independence
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Red Line Metro Access (300m walk)
                  </span>
                </div>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ready
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/goals/${activeGoal.id}/plan`)}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-50 text-[#1E60F2] hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Inspect AI Plan Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pending Consequential Actions (User Approval Required) */}
          {pendingActions.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/70 to-rose-50/50 border border-amber-200/80 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Action Requires Approval
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {pendingActions[0].title}
              </p>
              <div className="p-2.5 rounded-xl bg-white/90 border border-amber-100 text-[11px] text-slate-500 mb-3">
                <span className="font-semibold text-slate-700">Consequence: </span>
                {pendingActions[0].consequence}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveAction(pendingActions[0].id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                >
                  Approve Execution
                </button>
                <button
                  onClick={() => navigate('/actions')}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Motivational Card */}
          <MotivationCard
            quote="Small goals make big changes."
            author="LIFEOS"
            className="px-0 py-0"
          />

          {/* Upcoming Key Deadlines */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1E60F2]" />
              <span>Upcoming Milestones</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Hostel Portal Deadline</p>
                  <p className="text-[11px] text-slate-400">Income Certificate required</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10.5px]">
                  Aug 14
                </span>
              </div>
              <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">College Reporting Day</p>
                  <p className="text-[11px] text-slate-400">Physical verification on campus</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10.5px]">
                  Aug 25
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AgentModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />

      <QuickActionModal
        actionId={activeQuickAction}
        onClose={() => setActiveQuickAction(null)}
        onCompleteAction={(msg) => showToast(msg, 'success')}
      />
    </div>
  );
};
