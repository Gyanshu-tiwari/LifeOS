import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Filter,
  Check,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Tag,
  ArrowRight,
  X,
  Trash2,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSModal } from '../components/ui/LifeOSModal';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  day: number;
  time: string;
  category: 'academic' | 'financial' | 'housing' | 'transit' | 'deadline';
  goalTitle: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted?: boolean;
}

export const CalendarPage: React.FC = () => {
  const { activeGoal, showToast } = useLifeOS();

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [selectedDay, setSelectedDay] = useState<number>(10);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-08-15');
  const [newEventTime, setNewEventTime] = useState('11:00 AM');
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('academic');

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'ev-1',
      title: 'Upload Income Certificate',
      description: 'Submit digital certificate on state portal for fee concession waiver',
      date: '2026-08-10',
      day: 10,
      time: '5:00 PM',
      category: 'financial',
      goalTitle: 'Move to Lucknow for College',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'ev-2',
      title: 'Compare Top 3 PG Options',
      description: 'Audit Gomti Nagar & Indira Nagar options with Maps Agent',
      date: '2026-08-11',
      day: 11,
      time: '2:30 PM',
      category: 'housing',
      goalTitle: 'Move to Lucknow for College',
      priority: 'medium',
      isCompleted: false,
    },
    {
      id: 'ev-3',
      title: 'Hostel Registration Portal Closes',
      description: 'Strict cutoff for Lucknow University on-campus allotment',
      date: '2026-08-14',
      day: 14,
      time: '11:59 PM',
      category: 'deadline',
      goalTitle: 'Move to Lucknow for College',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'ev-4',
      title: 'Travel Departure to Lucknow',
      description: 'Train arrival at Lucknow Charbagh Station (8:30 AM)',
      date: '2026-08-20',
      day: 20,
      time: '8:30 AM',
      category: 'transit',
      goalTitle: 'Move to Lucknow for College',
      priority: 'medium',
      isCompleted: false,
    },
    {
      id: 'ev-5',
      title: 'College Reporting & Document Verification',
      description: 'In-person verification at University of Lucknow Administrative Block',
      date: '2026-08-25',
      day: 25,
      time: '9:00 AM',
      category: 'academic',
      goalTitle: 'Move to Lucknow for College',
      priority: 'high',
      isCompleted: false,
    },
  ]);

  const getCategoryStyles = (category: CalendarEvent['category']) => {
    switch (category) {
      case 'deadline':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
          badge: 'bg-rose-500 text-white',
        };
      case 'financial':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500',
          badge: 'bg-amber-500 text-white',
        };
      case 'housing':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: 'bg-blue-500',
          badge: 'bg-blue-600 text-white',
        };
      case 'transit':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dot: 'bg-purple-500',
          badge: 'bg-purple-600 text-white',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-600 text-white',
        };
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const parsedDay = parseInt(newEventDate.split('-')[2] || '15', 10);
    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      day: isNaN(parsedDay) ? 15 : parsedDay,
      time: newEventTime,
      category: newEventCategory,
      goalTitle: activeGoal.title,
      priority: 'medium',
      isCompleted: false,
    };

    setEvents((prev) => [...prev, newEv]);
    setNewEventTitle('');
    setShowCreateModal(false);
    showToast(`Added event "${newEv.title}" to calendar`, 'success');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
    showToast('Event removed', 'info');
  };

  const handleToggleEventComplete = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isCompleted: !e.isCompleted } : e))
    );
    setSelectedEvent((prev) => (prev ? { ...prev, isCompleted: !prev.isCompleted } : null));
    showToast('Event status updated', 'success');
  };

  // Calendar dates for August 2026 (Starts on Saturday, 31 days)
  const daysInMonth = 31;
  const startDayOffset = 6; // Saturday

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Time-Integrated Goal Planning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Planning Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your real-world milestones, agent dependencies, and synchronized deadlines.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Switcher */}
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center gap-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-soft-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-soft-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-soft-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Agenda
            </button>
          </div>

          <LifeOSButton
            onClick={() => setSelectedDay(10)}
            variant="outline"
            size="sm"
          >
            Today
          </LifeOSButton>

          <LifeOSButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Milestone
          </LifeOSButton>
        </div>
      </div>

      {/* Main Grid: Calendar Interface (8 cols) + AI Scheduling Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Area (8 of 12 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Month & Week Navigation Toolbar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base sm:text-lg font-extrabold text-[#0B192C]">
                August 2026
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E60F2] border border-blue-100">
                Active Goal Cycle
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous period"
                onClick={() => showToast('Navigated to July 2026', 'info')}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                aria-label="Next period"
                onClick={() => showToast('Navigated to September 2026', 'info')}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: MONTH GRID */}
          {viewMode === 'month' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-3">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty leading cells */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[105px] rounded-2xl bg-slate-50/40 p-2 opacity-30" />
                ))}

                {/* Days 1 to 31 */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = events.filter((e) => e.day === day);
                  const isToday = day === 10;
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[56px] sm:min-h-[105px] rounded-2xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/50 border-[#1E60F2] ring-2 ring-blue-500/20 shadow-sm'
                          : isToday
                          ? 'bg-amber-50/30 border-amber-300'
                          : dayEvents.length > 0
                          ? 'bg-white border-slate-200 hover:border-blue-300 shadow-soft-sm'
                          : 'bg-white border-slate-100 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? 'text-[#1E60F2]'
                              : isToday
                              ? 'text-amber-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <span className="hidden sm:inline-block text-[9.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Event Chips (Desktop: Full Chips, Mobile: Minimal Dots) */}
                      {dayEvents.length > 0 && (
                        <>
                          {/* Mobile Dots */}
                          <div className="flex sm:hidden items-center justify-center gap-1 mt-1">
                            {dayEvents.slice(0, 3).map((ev) => {
                              const style = getCategoryStyles(ev.category);
                              return (
                                <span
                                  key={ev.id}
                                  className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                                />
                              );
                            })}
                          </div>

                          {/* Desktop Full Chips */}
                          <div className="hidden sm:block space-y-1 mt-1 overflow-hidden">
                            {dayEvents.map((ev) => {
                              const style = getCategoryStyles(ev.category);
                              return (
                                <button
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(ev);
                                  }}
                                  className={`w-full text-left text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-lg truncate border flex items-center gap-1 transition-all ${
                                    ev.isCompleted
                                      ? 'bg-slate-100 text-slate-400 line-through border-slate-200'
                                      : style.bg
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                                  <span className="truncate">{ev.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: WEEK TIMELINE */}
          {viewMode === 'week' && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
              <div className="text-xs font-bold text-slate-500">
                Week of Aug 9 – Aug 15, 2026 (Critical Relocation Milestones)
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { d: 9, name: 'Sun' },
                  { d: 10, name: 'Mon (Today)' },
                  { d: 11, name: 'Tue' },
                  { d: 12, name: 'Wed' },
                  { d: 13, name: 'Thu' },
                  { d: 14, name: 'Fri (Cutoff)' },
                  { d: 15, name: 'Sat' },
                ].map((item) => {
                  const dayEvents = events.filter((e) => e.day === item.d);
                  return (
                    <div
                      key={item.d}
                      className={`min-h-[220px] rounded-2xl p-2.5 border flex flex-col justify-between ${
                        item.d === 10
                          ? 'bg-blue-50/60 border-[#1E60F2]'
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="border-b border-slate-200/80 pb-1.5 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          {item.name}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800">
                          {item.d}
                        </span>
                      </div>

                      <div className="space-y-2 mt-2 flex-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="p-2 rounded-xl bg-white border border-slate-200 shadow-soft-sm text-xs cursor-pointer hover:border-blue-400"
                          >
                            <span className="text-[10px] font-bold text-[#1E60F2] block">{ev.time}</span>
                            <span className="font-semibold text-slate-800 line-clamp-2 mt-0.5">{ev.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: AGENDA CHRONOLOGICAL STREAM */}
          {viewMode === 'agenda' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                Chronological Goal Agenda
              </h3>
              <div className="space-y-3">
                {events.map((ev) => {
                  const style = getCategoryStyles(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${style.badge}`}
                        >
                          Aug {ev.day}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                            <span className="text-[10.5px] font-semibold text-slate-400">
                              {ev.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{ev.description}</p>
                          <span className="text-[10.5px] text-[#1E60F2] font-semibold mt-1 inline-block">
                            Goal: {ev.goalTitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <LifeOSButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEventComplete(ev.id);
                          }}
                          variant={ev.isCompleted ? 'secondary' : 'outline'}
                          size="sm"
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          {ev.isCompleted ? 'Done' : 'Mark Complete'}
                        </LifeOSButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: AI Scheduling Intelligence & Goal Timeline (4 of 12 columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Scheduling Suggestions */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-100 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Planning Agent Suggestions</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 rounded-2xl bg-white/90 border border-blue-100 shadow-soft-sm space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Urgent Today
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Your <strong>Income Certificate</strong> is due for upload. Completing this unlocks the Lucknow University hostel fee waiver before Aug 14.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-blue-100 shadow-soft-sm space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Schedule Notice
                </span>
                <p className="text-slate-600 leading-relaxed">
                  PG comparisons should be completed by <strong>Friday</strong> to ensure room availability in Indira Nagar near the Metro station.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-blue-100 shadow-soft-sm space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Countdown
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Your college reporting day in Lucknow is exactly <strong>15 days away</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Goal Milestone Pipeline */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1E60F2]" />
              <span>Goal → Milestone Timeline</span>
            </h3>

            <div className="relative pl-5 space-y-4 border-l-2 border-blue-200 ml-2">
              {[
                { date: 'Aug 10', label: 'Upload Documents', status: 'current' },
                { date: 'Aug 11', label: 'Compare PG Listings', status: 'upcoming' },
                { date: 'Aug 14', label: 'Hostel Registration Cutoff', status: 'deadline' },
                { date: 'Aug 20', label: 'Travel to Lucknow', status: 'upcoming' },
                { date: 'Aug 25', label: 'College Orientation Day', status: 'goal' },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <span
                    className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                      step.status === 'current'
                        ? 'bg-[#1E60F2] ring-blue-400 animate-ping'
                        : step.status === 'deadline'
                        ? 'bg-rose-500 ring-rose-200'
                        : 'bg-slate-300 ring-slate-100'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {step.date}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Agenda Quick Panel */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Selected Day (Aug {selectedDay})
              </span>
              <span className="text-[11px] text-[#1E60F2] font-semibold">
                {events.filter((e) => e.day === selectedDay).length} Events
              </span>
            </div>

            {events.filter((e) => e.day === selectedDay).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No scheduled milestones for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {events
                  .filter((e) => e.day === selectedDay)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ev.title}</span>
                        <span className="text-[10.5px] font-semibold text-slate-400">{ev.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{ev.description}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <LifeOSModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Goal Milestone"
        subtitle="Planning Agent will index this deadline into the goal critical path."
        footer={
          <>
            <LifeOSButton
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </LifeOSButton>
            <LifeOSButton
              variant="primary"
              size="sm"
              onClick={handleCreateEvent}
            >
              Save Milestone
            </LifeOSButton>
          </>
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Milestone Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="E.g. Submit Lucknow University Hostel Dossier"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date
              </label>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Time
              </label>
              <input
                type="text"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Category
            </label>
            <select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
            >
              <option value="academic">Academic (Admissions, Verification)</option>
              <option value="housing">Housing (PG, Flat inspection)</option>
              <option value="financial">Financial (Scholarship, Fees)</option>
              <option value="transit">Transit & Travel</option>
              <option value="deadline">Hard Cutoff / Deadline</option>
            </select>
          </div>
        </form>
      </LifeOSModal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <LifeOSModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          subtitle={`${selectedEvent.date} at ${selectedEvent.time}`}
          footer={
            <>
              <LifeOSButton
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                Delete
              </LifeOSButton>
              <LifeOSButton
                variant={selectedEvent.isCompleted ? 'secondary' : 'success'}
                size="sm"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                onClick={() => handleToggleEventComplete(selectedEvent.id)}
              >
                {selectedEvent.isCompleted ? 'Mark Pending' : 'Mark Completed'}
              </LifeOSButton>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase block mb-1">
                Description
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedEvent.description || 'No detailed description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Category
                </span>
                <span className="font-bold text-slate-800 capitalize mt-0.5 block">
                  {selectedEvent.category}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Associated Goal
                </span>
                <span className="font-bold text-[#1E60F2] truncate mt-0.5 block">
                  {selectedEvent.goalTitle}
                </span>
              </div>
            </div>
          </div>
        </LifeOSModal>
      )}
    </div>
  );
};
