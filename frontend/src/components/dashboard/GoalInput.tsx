import React, { useState } from 'react';
import { Sparkles, Mic, ArrowUp, X } from 'lucide-react';

interface GoalInputProps {
  onSubmitGoal?: (goalText: string) => void;
  className?: string;
}

export const GoalInput: React.FC<GoalInputProps> = ({
  onSubmitGoal,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onSubmitGoal) {
      onSubmitGoal(query.trim());
    }
    setQuery('');
  };

  const handleMicToggle = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      // Simulate voice capture prompt
      setQuery('Find affordable 1BHK near college with Metro access...');
    }
  };

  return (
    <section className={`w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`relative w-full rounded-2xl bg-white transition-all duration-200 border ${
          isFocused || isListening
            ? 'border-[#1E60F2] ring-4 ring-blue-500/10 shadow-soft-md'
            : 'border-slate-200/90 shadow-soft'
        }`}
      >
        <div className="flex items-center px-3 py-2.5 gap-2.5">
          {/* Left: AI Spark Icon */}
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>

          {/* Center: Command Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Tell LIFEOS what you want to accomplish..."
              aria-label="Tell LIFEOS what you want to accomplish"
              className="w-full bg-transparent border-0 p-0 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-[12.5px] placeholder:font-normal focus:outline-none focus:ring-0"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear input"
                className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center active:scale-95"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Microphone button */}
            <button
              type="button"
              onClick={handleMicToggle}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-400 animate-pulse'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            {/* Send / Execute button */}
            {query.trim().length > 0 && (
              <button
                type="submit"
                aria-label="Submit goal"
                className="w-7 h-7 rounded-lg bg-[#1E60F2] text-white flex items-center justify-center shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Listening Indicator Banner */}
        {isListening && (
          <div className="px-4 py-1.5 bg-rose-50/70 border-t border-rose-100 flex items-center justify-between text-xs text-rose-600 rounded-b-2xl">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening to voice goal command...
            </span>
            <button
              type="button"
              onClick={() => setIsListening(false)}
              className="text-[11px] underline font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </form>
    </section>
  );
};
