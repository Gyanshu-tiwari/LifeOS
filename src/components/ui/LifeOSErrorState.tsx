import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LifeOSButton } from './LifeOSButton';

export interface LifeOSErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const LifeOSErrorState: React.FC<LifeOSErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to complete the requested action or load data from LIFEOS services.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-3xl bg-rose-50/60 border border-rose-200/80 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3.5 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <LifeOSButton
            onClick={onRetry}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </LifeOSButton>
        </div>
      )}
    </div>
  );
};
