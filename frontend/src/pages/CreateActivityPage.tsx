import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mic, MicOff, Check, AlertCircle, Sparkles } from 'lucide-react';
import { activitiesApi, CreateActivityPayload } from '../api/activities';
import { queryKeys } from '../hooks/queryKeys';
import { useToast } from '../context/ToastContext';
import { normalizeApiError } from '../lib/errors';

/**
 * CreateActivityPage — takes natural language intent and creates an Activity.
 * Immediately transitions to /plans/:activityId/generating for a responsive,
 * engaging progress UX while the backend AI orchestrator works.
 */
export default function CreateActivityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [intent, setIntent] = useState<string>(location.state?.intent || '');
  const [apiError, setApiError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: CreateActivityPayload) => activitiesApi.createActivity(payload),
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      // Navigate immediately to the generating page so user sees real-time progress
      navigate(`/plans/${activity.id}/generating`, {
        state: { activityId: activity.id, title: activity.title },
      });
    },
    onError: (err: any) => {
      const normalized = normalizeApiError(err, 'Failed to create activity.');
      setApiError(normalized.userMessage);
      addToast({
        title: 'Could Not Create Plan',
        message: normalized.userMessage,
        type: 'error',
      });
    },
  });

  const isPending = createMutation.isPending;

  /**
   * Voice dictation using browser Web Speech API
   */
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        title: 'Voice Input Unavailable',
        message: 'Speech recognition is not supported in this browser. Please type your plan.',
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
          message: 'Speak your activity intent now.',
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
        addToast({
          title: 'Voice Recognition',
          message: 'Could not capture audio. Please type your plan.',
          type: 'info',
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  /**
   * Parse user's natural-language intent for structured clues.
   */
  const parseIntent = (raw: string): CreateActivityPayload => {
    const lower = raw.toLowerCase();
    let activity_type = 'GENERAL';
    let title = raw.substring(0, 100).trim();
    let origin_text: string | undefined;
    let destination_text: string | undefined;
    let travel_mode: string | undefined = localStorage.getItem('lifeos_pref_transport') || 'DRIVE';

    // Check for "from X to Y"
    const fromToMatch = raw.match(
      /from\s+([A-Za-z0-9\s]+?)\s+to\s+([A-Za-z0-9\s]+?)(?:\s+for|\s+by|\s+in|[.,]|$)/i
    );
    if (fromToMatch) {
      origin_text = fromToMatch[1].trim();
      destination_text = fromToMatch[2].trim();
      title = `${origin_text} to ${destination_text} Trip`;
      activity_type = 'ROAD_TRIP';
    } else if (lower.includes('trip') || lower.includes('travel') || lower.includes('going to')) {
      activity_type = 'TRAVEL';
    } else if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('appointment')) {
      activity_type = 'APPOINTMENT';
    } else if (lower.includes('interview')) {
      activity_type = 'INTERVIEW';
    } else if (lower.includes('relocat') || lower.includes('move')) {
      activity_type = 'RELOCATION';
    }

    if (lower.includes('car') || lower.includes('drive')) {
      travel_mode = 'DRIVE';
    } else if (lower.includes('walk')) {
      travel_mode = 'WALK';
    } else if (lower.includes('transit') || lower.includes('bus') || lower.includes('train')) {
      travel_mode = 'TRANSIT';
    } else if (lower.includes('bike') || lower.includes('cycle')) {
      travel_mode = 'BICYCLE';
    }

    return {
      title,
      raw_intent: raw,
      activity_type,
      origin_text,
      destination_text,
      travel_mode,
    };
  };

  const handleSubmit = () => {
    const trimmed = intent.trim();
    if (!trimmed || isPending) return;
    setApiError('');

    const payload = parseIntent(trimmed);
    createMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl md:shadow-soft-lg md:border md:border-gray-100 overflow-hidden relative">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-100 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?auto=format&fit=crop&q=80"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/80 to-white" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-4 md:p-8">
        <header className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition text-lifeos-navy"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-lifeos-navy tracking-tight">Create a plan</h1>
        </header>

        <div className="flex-1 flex flex-col">
          <h2 className="text-lg font-semibold text-lifeos-navy mb-3">What do you need to do?</h2>

          <div className="relative mb-5 shadow-soft rounded-2xl bg-white border border-gray-200 focus-within:border-lifeos-blue focus-within:ring-2 focus-within:ring-lifeos-blue/10 transition">
            <textarea
              className="w-full bg-transparent border-none outline-none p-4 pb-12 text-lifeos-dark placeholder:text-gray-400 resize-none min-h-[140px] text-sm font-medium leading-relaxed"
              placeholder="E.g. I am going from Delhi to Manali for 4 days by car…"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              maxLength={1000}
              disabled={isPending}
              aria-label="Activity description"
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <span className="text-xs text-lifeos-subtle">{intent.length}/1000</span>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-full transition-colors ${
                  isListening
                    ? 'bg-rose-100 text-rose-600 animate-pulse'
                    : 'text-lifeos-subtle hover:text-lifeos-blue hover:bg-lifeos-blueLight'
                }`}
                title={isListening ? 'Listening...' : 'Voice dictation'}
                aria-label="Voice input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>

          {apiError && (
            <div className="flex items-start space-x-2.5 bg-red-50 border border-red-100 text-red-700 text-xs font-medium px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-1.5 font-semibold text-lifeos-navy text-sm mb-3">
              <Sparkles size={16} className="text-lifeos-blue" />
              <span>LIFEOS AI will automatically configure:</span>
            </div>
            <ul className="space-y-2.5">
              {[
                'Preparation requirements and gear list',
                'Optimized route & real waypoint milestones',
                'Relevant verified places (food, fuel, lodging)',
                'Priority-sorted tasks and actionable checkpoints',
                'Day-by-day structured itinerary',
                'Essential packing suggestions',
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-xs md:text-sm text-lifeos-muted font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-emerald-700 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-4 pb-safe">
          <button
            onClick={handleSubmit}
            disabled={!intent.trim() || isPending}
            className="w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-full shadow-md hover:bg-lifeos-dark disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Plan...</span>
              </>
            ) : (
              <span>Create Plan →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
