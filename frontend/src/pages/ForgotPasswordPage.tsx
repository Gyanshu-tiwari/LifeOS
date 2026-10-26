import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-soft-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-lifeos-navy tracking-tight">LIFEOS</h1>
          <p className="text-lifeos-muted text-sm mt-2">Reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={48} className="text-lifeos-success mx-auto" />
            <h2 className="font-bold text-lifeos-navy">Check your inbox</h2>
            <p className="text-sm text-lifeos-muted">
              We've sent a password reset link to <strong>{email}</strong>.
              Check your spam folder if you don't see it.
            </p>
            <Link
              to="/login"
              className="block w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-xl text-center hover:bg-lifeos-dark transition mt-4"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <p className="text-sm text-lifeos-muted mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lifeos-navy text-white font-semibold py-3.5 rounded-xl hover:bg-lifeos-dark disabled:opacity-60 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-lifeos-muted">
              Remember your password?{' '}
              <Link to="/login" className="text-lifeos-blue hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
