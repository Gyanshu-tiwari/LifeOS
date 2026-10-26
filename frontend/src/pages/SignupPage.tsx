import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signup, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) { setError('Full name is required'); return; }
    if (!email) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await signup({ email, password, displayName: displayName.trim() });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-soft-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-lifeos-navy tracking-tight">LIFEOS</h1>
          <p className="text-lifeos-muted text-sm mt-2">Create your account</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl mb-4 leading-relaxed">
            <span className="font-semibold block mb-0.5">Firebase Configuration Required</span>
            Please configure <code className="bg-amber-100 px-1 rounded">VITE_FIREBASE_*</code> environment variables to create an account.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 transition text-sm"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 transition text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 transition text-sm pr-12"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lifeos-subtle hover:text-lifeos-muted transition p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 transition text-sm"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-xl hover:bg-lifeos-dark disabled:opacity-60 transition flex items-center justify-center space-x-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-lifeos-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-lifeos-blue hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
