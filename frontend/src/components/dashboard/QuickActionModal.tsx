import React, { useState } from 'react';
import { X, Sparkles, Compass, Search, Zap, FileUp, CheckCircle, ArrowRight } from 'lucide-react';

interface QuickActionModalProps {
  actionId: string | null;
  onClose: () => void;
  onCompleteAction?: (message: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  actionId,
  onClose,
  onCompleteAction,
}) => {
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!actionId) return null;

  const getActionDetails = () => {
    switch (actionId) {
      case 'plan':
        return {
          title: 'Planning Agent',
          subtitle: 'Create an intelligent multi-step plan',
          icon: <Compass className="w-5 h-5 text-[#1E60F2]" />,
          placeholder: 'E.g. Create a 7-day packing and travel schedule for Lucknow...',
          actionLabel: 'Generate Coordinated Plan',
        };
      case 'research':
        return {
          title: 'Research Agent',
          subtitle: 'Deep research across web & maps',
          icon: <Search className="w-5 h-5 text-purple-600" />,
          placeholder: 'E.g. Find PG options near Gomti Nagar with meals under ₹10,000...',
          actionLabel: 'Start Research Sweep',
        };
      case 'take-action':
        return {
          title: 'Action Agent',
          subtitle: 'Automate forms, bookings, and alerts',
          icon: <Zap className="w-5 h-5 text-emerald-600" />,
          placeholder: 'E.g. Draft hostel inquiry email to college warden...',
          actionLabel: 'Execute with Approval',
        };
      case 'upload':
        return {
          title: 'Document Agent',
          subtitle: 'Extract and verify required documents',
          icon: <FileUp className="w-5 h-5 text-amber-600" />,
          placeholder: 'Upload Income Certificate or Admission Letter...',
          actionLabel: 'Verify & Ingest Document',
        };
      default:
        return {
          title: 'LIFEOS Agent',
          subtitle: 'Goal assistance',
          icon: <Sparkles className="w-5 h-5 text-blue-600" />,
          placeholder: 'Describe your request...',
          actionLabel: 'Submit to LIFEOS',
        };
    }
  };

  const details = getActionDetails();

  const handleAction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onCompleteAction) {
        onCompleteAction(`${details.title} executed successfully!`);
      }
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-soft-sm">
              {details.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{details.title}</h3>
              <p className="text-xs text-slate-500">{details.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-3">
          {actionId === 'upload' ? (
            <div className="space-y-3">
              <label
                htmlFor="file-upload"
                className="w-full border-2 border-dashed border-amber-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/50 transition-colors"
              >
                <FileUp className="w-8 h-8 text-amber-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  {uploadedFile ? uploadedFile : 'Choose Income Certificate (PDF / JPG)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Required for hostel & fee concession verification
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadedFile(e.target.files[0].name);
                    }
                  }}
                />
              </label>
              {uploadedFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>File ready for Document Agent validation</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Describe details or constraints
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={details.placeholder}
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
          )}

          {/* Connected Agent Pipeline Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Verified by Verification Agent</span>
            <span className="font-semibold text-emerald-600">Active Pipeline</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleAction}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E60F2] text-white text-xs font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{details.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
