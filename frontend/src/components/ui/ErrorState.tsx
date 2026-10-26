import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { normalizeError } from '../../lib/errors';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
  showBack?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  title,
  message,
  fallbackMessage,
  onRetry,
  showBack = false,
  className,
}: ErrorStateProps) {
  const navigate = useNavigate();
  const normalized = error ? normalizeError(error) : null;

  const displayTitle = title || normalized?.title || 'Something went wrong';
  const displayMessage =
    message ||
    fallbackMessage ||
    normalized?.message ||
    'We encountered an unexpected error. Please try again.';

  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-8 border border-gray-100 shadow-soft text-center max-w-md mx-auto my-6 flex flex-col items-center',
        className
      )}
    >
      <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle size={28} />
      </div>

      <h3 className="text-lg font-bold text-lifeos-navy mb-1.5">{displayTitle}</h3>
      <p className="text-sm text-lifeos-muted leading-relaxed mb-6 max-w-sm">{displayMessage}</p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full sm:w-auto bg-lifeos-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-lifeos-dark transition flex items-center justify-center space-x-2 shadow-sm active:scale-95"
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        )}

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-gray-50 text-lifeos-navy border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <ArrowLeft size={15} />
            <span>Go Back</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function InlineError({
  message,
  className,
  onRetry,
}: {
  message: string;
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={cn(
        'bg-rose-50/80 border border-rose-100 rounded-2xl p-4 flex items-center justify-between text-rose-900 text-sm',
        className
      )}
    >
      <div className="flex items-center space-x-2.5">
        <AlertCircle size={18} className="text-rose-500 shrink-0" />
        <span className="font-medium text-xs sm:text-sm">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-rose-700 hover:text-rose-900 underline ml-3 shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
