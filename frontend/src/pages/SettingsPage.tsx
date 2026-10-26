import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Shield,
  Check,
  Compass,
  Sliders,
  Trash2,
  LogOut,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Real, working user preferences stored locally
  const [unitSystem, setUnitSystem] = useState<'km' | 'mi'>(() => {
    return (localStorage.getItem('lifeos_pref_units') as 'km' | 'mi') || 'km';
  });

  const [defaultTransport, setDefaultTransport] = useState<string>(() => {
    return localStorage.getItem('lifeos_pref_transport') || 'DRIVE';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_pref_notifs') !== 'false';
  });

  useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ displayName: name.trim() });
      addToast({
        title: 'Profile Updated',
        message: 'Your display name has been saved.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (unit: 'km' | 'mi') => {
    setUnitSystem(unit);
    localStorage.setItem('lifeos_pref_units', unit);
    addToast({
      title: 'Preferences Saved',
      message: `Distance units set to ${unit === 'km' ? 'Kilometers' : 'Miles'}.`,
      type: 'info',
    });
  };

  const handleTransportChange = (mode: string) => {
    setDefaultTransport(mode);
    localStorage.setItem('lifeos_pref_transport', mode);
    addToast({
      title: 'Preferences Saved',
      message: `Default travel mode set to ${mode.toLowerCase()}.`,
      type: 'info',
    });
  };

  const handleNotificationToggle = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('lifeos_pref_notifs', String(next));
    addToast({
      title: 'Notification Setting',
      message: next ? 'In-app notifications enabled.' : 'In-app notifications muted.',
      type: 'info',
    });
  };

  const handleClearCache = async () => {
    try {
      await queryClient.invalidateQueries();
      addToast({
        title: 'Cache Refreshed',
        message: 'All local query caches have been cleared and refreshed.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Cache Reset Failed',
        message: 'Could not reset client cache.',
        type: 'error',
      });
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      addToast({
        title: 'Signed Out',
        message: 'You have been signed out safely.',
        type: 'info',
      });
      navigate('/login');
    } catch (err: any) {
      addToast({
        title: 'Sign Out Error',
        message: err.message || 'Failed to sign out cleanly.',
        type: 'error',
      });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg pt-4 pb-6 max-w-2xl mx-auto w-full px-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition text-lifeos-navy"
            aria-label="Back to profile"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-lifeos-navy tracking-tight">Settings</h1>
            <p className="text-xs text-lifeos-muted">Manage your preferences and application settings</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="text-xs font-semibold text-lifeos-blue hover:underline flex items-center gap-1"
        >
          View Profile
          <ChevronRight size={14} />
        </button>
      </header>

      <div className="space-y-6">
        {/* Personal Profile Section */}
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5 text-lifeos-navy font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-lifeos-blue flex items-center justify-center">
                <User size={18} />
              </div>
              <span>Personal Information</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs text-lifeos-blue hover:text-lifeos-navy font-medium transition"
            >
              Account Details →
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-lifeos-blue focus:ring-2 focus:ring-lifeos-blue/10 transition text-sm text-lifeos-navy font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed select-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Email is managed securely by your Firebase authentication identity.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading || !name.trim() || name === currentUser?.displayName}
                className="bg-lifeos-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-lifeos-blue transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-soft-sm"
              >
                {loading ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>

        {/* Planning & Routing Preferences */}
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm border border-gray-100">
          <div className="flex items-center space-x-2.5 mb-4 text-lifeos-navy font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass size={18} />
            </div>
            <span>Journey & Route Preferences</span>
          </div>

          <div className="space-y-4">
            {/* Units */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-lifeos-navy">Distance Units</p>
                <p className="text-xs text-lifeos-muted">Measurement standard for journey routes and places</p>
              </div>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleUnitChange('km')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    unitSystem === 'km'
                      ? 'bg-white text-lifeos-navy shadow-sm'
                      : 'text-gray-500 hover:text-lifeos-navy'
                  }`}
                >
                  km
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('mi')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    unitSystem === 'mi'
                      ? 'bg-white text-lifeos-navy shadow-sm'
                      : 'text-gray-500 hover:text-lifeos-navy'
                  }`}
                >
                  mi
                </button>
              </div>
            </div>

            {/* Default Travel Mode */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-lifeos-navy">Default Travel Mode</p>
                <p className="text-xs text-lifeos-muted">Primary transportation mode for itinerary routing</p>
              </div>
              <select
                value={defaultTransport}
                onChange={(e) => handleTransportChange(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-lifeos-navy text-xs font-semibold rounded-xl px-3 py-1.5 focus:border-lifeos-blue outline-none"
              >
                <option value="DRIVE">Driving (Car)</option>
                <option value="WALK">Walking</option>
                <option value="TRANSIT">Public Transit</option>
                <option value="BICYCLE">Bicycle</option>
              </select>
            </div>

            {/* Notification toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-lifeos-navy">In-App Notifications</p>
                <p className="text-xs text-lifeos-muted">Status alerts for completed tasks and plan updates</p>
              </div>
              <button
                type="button"
                onClick={handleNotificationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  notificationsEnabled ? 'bg-lifeos-blue' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={notificationsEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data & Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm border border-gray-100">
          <div className="flex items-center space-x-2.5 mb-4 text-lifeos-navy font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <span>Data & Performance</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-lifeos-navy">Client Query Cache</p>
              <p className="text-xs text-lifeos-muted">Clear cached API responses to force fresh state</p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-lifeos-navy font-semibold text-xs rounded-xl transition active:scale-95"
            >
              Refresh Cache
            </button>
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm border border-gray-100 flex items-start space-x-3 text-sm text-lifeos-muted">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-lifeos-blue flex items-center justify-center shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div>
            <p className="font-bold text-lifeos-navy">LIFEOS Mobile v1.0.0</p>
            <p className="text-xs mt-0.5 text-lifeos-muted leading-relaxed">
              AI-Powered Real-World Activity and Journey Planning Operating System. Real-time itinerary planning, interactive routes, and context-aware task management.
            </p>
          </div>
        </div>

        {/* Account Actions / Sign Out */}
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm border border-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-rose-600">Sign Out</p>
              <p className="text-xs text-lifeos-muted">Sign out of your LIFEOS account on this device</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
