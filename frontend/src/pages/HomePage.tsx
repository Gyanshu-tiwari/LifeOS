import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Search, Plus, ListTodo, ChevronRight, CheckCircle2, Sparkles, Compass } from 'lucide-react';
import { useAuth } from '../auth';
import { useActivities, useActivityPlans, useNextAction, usePlanProgress } from '../hooks';
import { Activity } from '../types';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/ui/EmptyState';
import { NotificationBellButton } from '../components/notifications/NotificationPanel';

export default function HomePage() {
  const [intent, setIntent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const { data: activitiesData, isLoading } = useActivities({ limit: 10 });
  const activities = activitiesData?.items || [];
  const latestActivity = activities.find((a) => a.status !== 'COMPLETED') || activities[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim()) {
      navigate('/create', { state: { intent: intent.trim() } });
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        title: 'Voice Input',
        message: 'Voice recognition is not supported in this browser. Please type your intent.',
        type: 'info',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        addToast({
          title: 'Listening...',
          message: 'Speak your plan or destination.',
          type: 'info',
          duration: 3000,
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setIntent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
  const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Explorer');

  return (
    <div className="flex flex-col space-y-6 pt-4 pb-6 max-w-4xl mx-auto w-full">
      <header className="px-4 flex items-start justify-between">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-wider text-lifeos-muted mb-0.5">{greeting}</h1>
          <h2 className="text-2xl font-bold text-lifeos-navy tracking-tight">{userName}</h2>
          <p className="text-lifeos-muted text-xs md:text-sm mt-0.5">What are you planning today?</p>
        </div>
        <NotificationBellButton />
      </header>

      {/* Main Intent Input */}
      <div className="px-4">
        <form
          onSubmit={handleCreate}
          className="relative flex items-center bg-white shadow-soft rounded-full overflow-hidden border border-gray-200 focus-within:border-lifeos-blue focus-within:ring-2 focus-within:ring-lifeos-blue/10 p-1.5 transition"
        >
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-sm text-lifeos-dark placeholder:text-gray-400 font-medium"
            placeholder="Tell LIFEOS what you need to do..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            aria-label="Planning prompt"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 rounded-full transition-colors mx-1 ${
              isListening ? 'text-rose-600 bg-rose-50 animate-pulse' : 'text-lifeos-blue hover:bg-lifeos-blueLight'
            }`}
            title="Voice input"
            aria-label="Voice input"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            type="submit"
            disabled={!intent.trim()}
            className="p-2.5 bg-lifeos-navy text-white hover:bg-lifeos-blue rounded-full transition-colors disabled:opacity-40 active:scale-95 shadow-soft-sm"
            aria-label="Submit plan"
          >
            <Plus size={18} />
          </button>
        </form>
      </div>

      {/* Real Next Action Section */}
      {latestActivity && <LatestActivityNextAction activity={latestActivity} />}

      {/* Active Plans List */}
      <div className="px-4 flex-1">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-lifeos-navy">Active Plans</h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-lifeos-blue font-semibold hover:underline"
          >
            See all
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-soft-sm flex items-center space-x-3.5 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-1.5 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No Active Plans"
            description="Tell LIFEOS what you're planning or tap below to build your first itinerary."
            actionLabel="Start Planning"
            onAction={() => navigate('/create')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activities.map((activity) => (
              <ActivityCardItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LatestActivityNextAction({ activity }: { activity: Activity }) {
  const navigate = useNavigate();
  const { data: plans } = useActivityPlans(activity.id);
  const activePlan = plans?.[0];
  const { data: nextActionData } = useNextAction(activePlan?.id);

  if (!activePlan || !nextActionData?.task) {
    return null;
  }

  const task = nextActionData.task;

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-lifeos-navy flex items-center gap-1.5">
          <Sparkles size={14} className="text-lifeos-blue" />
          <span>Priority Next Action</span>
        </h3>
      </div>
      <div
        onClick={() => navigate(`/plans/${activePlan.id}/tasks`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/plans/${activePlan.id}/tasks`);
          }
        }}
        className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3.5 shadow-soft-sm cursor-pointer hover:border-blue-200 transition active:scale-[0.99] select-none"
      >
        <div className="bg-white p-2.5 rounded-xl text-lifeos-blue shrink-0 shadow-soft-sm">
          <ListTodo size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lifeos-navy text-xs truncate uppercase tracking-wider">{activity.title}</h4>
          <p className="text-sm text-lifeos-blue font-semibold mt-0.5 leading-snug">{task.title}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center space-x-1 bg-white text-lifeos-blue text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-lifeos-blue" />
              <span>{task.priority === 'HIGH' ? 'Essential' : 'Recommended'}</span>
            </span>
            {task.due_at && (
              <span className="text-[11px] text-lifeos-muted font-medium">Due soon</span>
            )}
          </div>
        </div>
        <button
          className="text-xs bg-lifeos-navy text-white px-3.5 py-1.5 rounded-full font-semibold shadow-soft-sm hover:bg-lifeos-blue transition shrink-0 mt-1"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/plans/${activePlan.id}/tasks`);
          }}
        >
          View Task
        </button>
      </div>
    </div>
  );
}

function ActivityCardItem({ activity }: { activity: Activity }) {
  const navigate = useNavigate();
  const { data: plans } = useActivityPlans(activity.id);
  const plan = plans?.[0];
  const { data: progress } = usePlanProgress(plan?.id);

  const percent = progress?.completion_percent ?? (activity.status === 'COMPLETED' ? 100 : 0);

  const handleClick = () => {
    if (plan) {
      navigate(`/plans/${plan.id}`);
    } else {
      navigate(`/plans/${activity.id}/generating`, { state: { activityId: activity.id } });
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="bg-white rounded-2xl p-3.5 flex items-center space-x-3.5 shadow-soft-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-soft transition active:scale-[0.99] select-none"
    >
      <div className="w-12 h-12 bg-blue-50 text-lifeos-blue rounded-xl flex items-center justify-center shrink-0">
        {percent === 100 ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Search size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-lifeos-navy truncate">{activity.title || activity.raw_intent}</h4>
        <p className="text-xs text-lifeos-muted truncate mt-0.5">
          {activity.activity_type} • {activity.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
        </p>
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-lifeos-blue h-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="text-xs font-bold text-lifeos-navy flex items-center space-x-1 shrink-0 ml-1">
        <span>{Math.round(percent)}%</span>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </div>
  );
}
