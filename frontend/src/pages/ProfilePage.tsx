import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useToast } from '../context/ToastContext';
import { useActivities } from '../hooks';
import {
  User,
  Settings,
  Shield,
  CheckCircle2,
  Calendar,
  LogOut,
  ChevronRight,
  Sparkles,
  Server,
  Edit3,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO, isValid } from 'date-fns';

export default function ProfilePage() {
  const { currentUser, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isSuccess: isBackendOnline, isLoading: isCheckingBackend } = useActivities({ limit: 1 });

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      toast.info('You have been signed out.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      setIsSavingName(true);
      await updateProfile({ displayName: trimmed });
      toast.success('Your profile name has been updated.');
      setIsEditingName(false);
    } catch {
      toast.error('Could not update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const displayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Explorer');
  const email = currentUser?.email || 'Authenticated User';
  const initial = displayName.charAt(0).toUpperCase();

  // Safely format joined date
  let joinedDate = 'Active member';
  try {
    const rawTime = (currentUser as any)?.metadata?.creationTime;
    if (rawTime) {
      const parsed = new Date(rawTime);
      if (isValid(parsed)) {
        joinedDate = `Joined ${format(parsed, 'MMMM yyyy')}`;
      }
    }
  } catch {
    // fallback
  }

  // Safely format last sign-in
  let lastSignIn = 'Active session';
  try {
    const rawLast = (currentUser as any)?.metadata?.lastSignInTime;
    if (rawLast) {
      const parsed = new Date(rawLast);
      if (isValid(parsed)) {
        lastSignIn = format(parsed, 'MMM d, yyyy • h:mm a');
      }
    }
  } catch {
    // fallback
  }

  return (
    <div className="flex flex-col h-full bg-lifeos-bg pt-4 pb-6 max-w-2xl mx-auto w-full px-4">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-lifeos-navy tracking-tight">Account Profile</h1>
          <p className="text-xs text-lifeos-muted mt-0.5">Manage your identity, security, and preferences</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-2.5 text-lifeos-navy bg-white rounded-2xl shadow-soft-sm border border-gray-100 hover:bg-gray-50 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Settings"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      {/* Main Profile Hero Card */}
      <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-gray-100 mb-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-tr from-lifeos-navy via-lifeos-blue to-lifeos-accent text-white rounded-3xl overflow-hidden shadow-md flex items-center justify-center text-2xl font-bold border-2 border-white">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="Active Account">
            <CheckCircle2 size={13} className="text-white stroke-[3]" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <h2 className="text-xl font-bold text-lifeos-navy truncate">{displayName}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 self-center sm:self-auto mt-1 sm:mt-0">
              Verified
            </span>
          </div>
          <p className="text-sm text-lifeos-muted truncate mt-0.5">{email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-lifeos-subtle font-medium">
            <span className="flex items-center space-x-1">
              <Calendar size={13} />
              <span>{joinedDate}</span>
            </span>
            <span>•</span>
            <button
              onClick={() => {
                setNameInput(displayName);
                setIsEditingName(true);
              }}
              className="text-lifeos-blue hover:underline flex items-center space-x-1 font-semibold"
            >
              <Edit3 size={12} />
              <span>Edit Name</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-soft-lg max-w-sm w-full animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lifeos-navy text-base">Edit Display Name</h3>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded-lg text-lifeos-subtle hover:text-lifeos-navy"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-lifeos-muted uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-lifeos-muted hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingName || !nameInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-lifeos-navy text-white text-sm font-semibold hover:bg-lifeos-dark transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSavingName && <Loader2 size={14} className="animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {/* Section 1: Authentication & Security */}
        <section>
          <h3 className="text-xs font-bold text-lifeos-muted uppercase tracking-wider px-1 mb-2.5">
            Authentication & Security
          </h3>
          <div className="bg-white rounded-2xl shadow-soft-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden text-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-lifeos-blue flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">Identity Provider</p>
                  <p className="text-xs text-lifeos-muted mt-1">Firebase Authentication</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Connected
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-lifeos-muted flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">Last Active Session</p>
                  <p className="text-xs text-lifeos-muted mt-1">{lastSignIn}</p>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">Token Verification</p>
                  <p className="text-xs text-lifeos-muted mt-1">RS256 Bearer Token Verification</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Application Information */}
        <section>
          <h3 className="text-xs font-bold text-lifeos-muted uppercase tracking-wider px-1 mb-2.5">
            Application Status
          </h3>
          <div className="bg-white rounded-2xl shadow-soft-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden text-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Server size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">API Backend Connection</p>
                  <p className="text-xs text-lifeos-muted mt-1">FastAPI Engine</p>
                </div>
              </div>
              <span className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5',
                isBackendOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                )} />
                <span>{isCheckingBackend ? 'Checking…' : isBackendOnline ? 'Operational' : 'Connecting'}</span>
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">LIFEOS Release</p>
                  <p className="text-xs text-lifeos-muted mt-1">AI-Powered Activity Planner</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                v1.0.0
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Navigation Preferences */}
        <section>
          <div className="bg-white rounded-2xl shadow-soft-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 text-sm">
            <button
              onClick={() => navigate('/settings')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-lifeos-blue flex items-center justify-center">
                  <Settings size={16} />
                </div>
                <div>
                  <p className="font-semibold text-lifeos-navy leading-none">Preferences & Configuration</p>
                  <p className="text-xs text-lifeos-muted mt-1">Units, appearance, and notifications</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-lifeos-subtle" />
            </button>
          </div>
        </section>

        {/* Logout Button */}
        <section className="pt-2">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center space-x-2 bg-white rounded-2xl p-4 text-rose-600 font-semibold shadow-soft-sm border border-rose-100 transition hover:bg-rose-50/50 disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            <span>Sign out of LIFEOS</span>
          </button>
        </section>
      </div>
    </div>
  );
}
