import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('oobCode') || searchParams.get('code') || undefined;
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password, code);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-soft-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-lifeos-navy tracking-tight">LIFEOS</h1>
          <p className="text-lifeos-muted text-sm mt-2">Create a new password</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={48} className="text-lifeos-success mx-auto" />
            <h2 className="font-bold text-lifeos-navy">Password updated!</h2>
            <p className="text-sm text-lifeos-muted">
              Your password has been changed successfully.
            </p>
            <Link
              to="/login"
              className="block w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-xl text-center hover:bg-lifeos-dark transition mt-4"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-lifeos-blue focus:ring-1 focus:ring-lifeos-blue/20 transition text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-lifeos-muted uppercase tracking-wide mb-1.5 block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
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
                className="w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-xl hover:bg-lifeos-dark disabled:opacity-60 transition mt-2 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
