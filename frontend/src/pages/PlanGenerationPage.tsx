import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, RefreshCw, Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { activitiesApi } from '../api/activities';
import { PlanRun } from '../types';
import { normalizeApiError } from '../lib/errors';
import { useToast } from '../context/ToastContext';

interface PipelineStep {
  label: string;
  detail: string;
  minElapsed: number; // approximate seconds when this stage typically runs
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: 'Understanding activity intent', detail: 'Parsing goals, constraints, and locations', minElapsed: 0 },
  { label: 'Planning tasks & checklists', detail: 'Generating actionable to-dos and preparation items', minElapsed: 5 },
  { label: 'Finding relevant places', detail: 'Discovering verified food, fuel, stay, and landmarks', minElapsed: 13 },
  { label: 'Building route & journey', detail: 'Computing road waypoints and travel segments', minElapsed: 22 },
  { label: 'Organizing your itinerary', detail: 'Structuring timeline and day-by-day schedules', minElapsed: 30 },
  { label: 'Finalizing actionable plan', detail: 'Locking dependencies and assembling your board', minElapsed: 38 },
];

const TERMINAL_STATES: PlanRun['status'][] = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

export default function PlanGenerationPage() {
  const { id: activityId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeRunId, setActiveRunId] = useState<string | null>(
    searchParams.get('runId') || location.state?.runId || null
  );

  const [status, setStatus] = useState<PlanRun['status']>('QUEUED');
  const [activeStep, setActiveStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGeneratingRef = useRef(false);

  // Timer for elapsed seconds
  useEffect(() => {
    if (TERMINAL_STATES.includes(status)) {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Progress stage smoothly based on pipeline stages if still running
        const targetStep = PIPELINE_STEPS.findIndex((s) => next < s.minElapsed);
        if (targetStep === -1) {
          setActiveStep(PIPELINE_STEPS.length - 1);
        } else if (targetStep > 0) {
          setActiveStep(Math.max(0, targetStep - 1));
        }
        return next;
      });
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [status]);

  // Orchestrate generation request
  const startGeneration = useCallback(async () => {
    if (!activityId || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setErrorMsg('');
    setStatus('RUNNING');

    try {
      // Trigger plan generation run on backend with retry for transient propagation
      let planRun: PlanRun | null = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          planRun = await activitiesApi.generatePlan(activityId);
          break;
        } catch (e: any) {
          lastErr = e;
          if (attempt < 2 && (e?.response?.status === 404 || !e.response)) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw e;
        }
      }
      if (!planRun) throw lastErr;
      setActiveRunId(planRun.id);

      if (planRun.status === 'SUCCEEDED' && planRun.plan_id) {
        setStatus('SUCCEEDED');
        setActiveStep(PIPELINE_STEPS.length);
        addToast({
          title: 'Plan Ready',
          message: 'Your personalized plan has been created successfully!',
          type: 'success',
        });
        setTimeout(() => {
          navigate(`/plans/${planRun.plan_id}`, { replace: true });
        }, 1200);
      } else if (planRun.status === 'FAILED') {
        setStatus('FAILED');
        setErrorMsg(planRun.error_message || 'Plan generation failed. Please try again.');
      }
    } catch (err: any) {
      const normalized = normalizeApiError(err, 'We could not generate your plan right now.');
      setErrorMsg(normalized.userMessage);
      setStatus('FAILED');
      addToast({
        title: 'Plan Generation Failed',
        message: normalized.userMessage,
        type: 'error',
      });
    } finally {
      isGeneratingRef.current = false;
    }
  }, [activityId, addToast, navigate]);

  // Initial trigger or status check
  useEffect(() => {
    if (!activityId) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (activeRunId) {
      // If runId exists, poll status
      let isMounted = true;
      const poll = async () => {
        try {
          const run = await activitiesApi.getPlanRunStatus(activityId, activeRunId);
          if (!isMounted) return;

          setStatus(run.status);

          if (run.status === 'SUCCEEDED' && run.plan_id) {
            setActiveStep(PIPELINE_STEPS.length);
            addToast({
              title: 'Plan Ready',
              message: 'Your plan is ready to explore!',
              type: 'success',
            });
            setTimeout(() => {
              if (isMounted) navigate(`/plans/${run.plan_id}`, { replace: true });
            }, 1000);
            return;
          }

          if (run.status === 'FAILED') {
            setErrorMsg(run.error_message || 'Plan generation failed. Please try again.');
            return;
          }

          if (!TERMINAL_STATES.includes(run.status)) {
            pollTimerRef.current = setTimeout(poll, 2000);
          }
        } catch (err: any) {
          if (!isMounted) return;
          const normalized = normalizeApiError(err, 'Lost connection to generation status.');
          setErrorMsg(normalized.userMessage);
        }
      };

      poll();

      return () => {
        isMounted = false;
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      };
    } else {
      // Start generation run
      startGeneration();
    }
  }, [activityId, activeRunId, navigate, startGeneration, addToast]);

  const handleRetry = async () => {
    setRetrying(true);
    setElapsedSeconds(0);
    setActiveStep(0);
    setErrorMsg('');
    setStatus('QUEUED');
    await startGeneration();
    setRetrying(false);
  };

  const isSuccess = status === 'SUCCEEDED';
  const isFailed = status === 'FAILED' || Boolean(errorMsg);

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-lifeos-navy items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-soft-lg animate-bounce">
          <Check size={34} className="text-white stroke-[3]" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Your Plan is Ready!</h1>
        <p className="text-white/80 mt-2 text-sm max-w-sm">
          Everything is organized. Opening your interactive journey board...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-navy relative overflow-hidden text-white">
      {/* Background visual texture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80"
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lifeos-navy via-lifeos-navy/90 to-lifeos-navy/70" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-5 md:p-8 max-w-lg mx-auto w-full justify-between">
        {/* Header navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition active:scale-95"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Live elapsed timer */}
          {!isFailed && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/90 border border-white/10 backdrop-blur-sm">
              <Clock size={13} className="text-lifeos-blueLight animate-pulse" />
              <span>{elapsedSeconds}s elapsed</span>
            </div>
          )}
        </div>

        {/* Hero Title */}
        <div className="flex flex-col items-center justify-center text-center my-6">
          <div className="w-14 h-14 mb-4 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-lifeos-blueLight shadow-soft-lg">
            <Sparkles size={28} className="animate-spin text-lifeos-blue" style={{ animationDuration: '6s' }} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {isFailed ? 'Generation Encountered an Issue' : 'Crafting Your Real-World Plan'}
          </h1>

          {!isFailed ? (
            <p className="text-white/75 text-xs md:text-sm max-w-xs leading-relaxed">
              Synthesizing live route data, task dependencies, and location recommendations.
            </p>
          ) : (
            <p className="text-white/70 text-xs md:text-sm max-w-xs">
              We encountered a temporary problem while building your plan.
            </p>
          )}
        </div>

        {/* Status card or Error card */}
        {isFailed ? (
          <div className="bg-red-950/40 backdrop-blur-md rounded-2xl p-5 mb-8 border border-red-500/30 shadow-soft-lg">
            <div className="flex items-start space-x-3 text-red-200">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-white">Plan Generation Failed</p>
                <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-lifeos-navy py-2.5 rounded-xl font-bold text-xs hover:bg-white/90 transition disabled:opacity-50 active:scale-95 shadow-soft-sm"
              >
                <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
                <span>{retrying ? 'Retrying…' : 'Try Again'}</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/15 transition active:scale-95"
              >
                Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-8 shadow-soft-lg border border-white/10">
            <ul className="space-y-3.5">
              {PIPELINE_STEPS.map((step, i) => {
                const isCompleted = i < activeStep;
                const isActive = i === activeStep;

                return (
                  <li key={i} className="flex items-start space-x-3.5 transition-all duration-300">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                          : isActive
                          ? 'border-white border-t-transparent animate-spin'
                          : 'border-white/20'
                      }`}
                    >
                      {isCompleted && <Check size={13} className="text-white stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${
                          isCompleted
                            ? 'text-white'
                            : isActive
                            ? 'text-white font-bold'
                            : 'text-white/40'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p
                        className={`text-[11px] transition-colors duration-300 ${
                          isActive ? 'text-white/80' : isCompleted ? 'text-white/60' : 'text-white/30'
                        }`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Footer controls */}
        {!isFailed && (
          <div className="pb-safe">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-white/10 backdrop-blur-md text-white/90 hover:text-white font-medium py-3 rounded-full border border-white/15 hover:bg-white/15 transition active:scale-95 text-xs"
            >
              Continue in Background
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
