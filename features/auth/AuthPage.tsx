"use client";
import React, { useState } from 'react';
import { adminDestination, useNavigate } from '@/lib/navigation';
import { useAppStore } from '../../store';
import { authService, AuthSessionUser } from '@/lib/auth/authService';
import { sounds } from '../../utils/audio';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC<{ initialError?: string | null; passwordUpdated?: boolean }> = ({ initialError, passwordUpdated }) => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.signInWithEmail(email, password);

      if (!res.success || !res.user) {
        sounds.playError();
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
        setIsLoading(false);
        return;
      }

      sounds.playSuccess();
      const user = res.user;
      setCurrentUser(user);

      const permissions = user.effectivePermissions || [];
      let targetRoute = '/';
      if (user.role === 'admin') {
        targetRoute = adminDestination(user.id);
      } else if (user.role === 'manager' && permissions.includes('staff.manage')) {
        targetRoute = '/manager';
      } else if (user.role === 'owner' && permissions.includes('reports.view')) {
        targetRoute = '/owner';
      } else if (permissions.includes('pos.access')) {
        targetRoute = '/pos';
      } else if (permissions.includes('kds.access')) {
        targetRoute = '/kds';
      } else if (permissions.includes('orders.view')) {
        targetRoute = '/orders';
      }

      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        navigate(targetRoute);
      }
    } catch (err: any) {
      sounds.playError();
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    const res = await authService.sendPasswordReset(resetEmail);
    setResetStatus(res);
  };

  return (
    <main className="tikkit-login">
      <div className="tikkit-login-brand coffee-signin">
        <img className="coffee-signin-photo" src="/assets/coffee/interior.webp" alt="" />
        <div className="tikkit-wordmark text-3xl" aria-label="Tikkit">TIKKIT</div>
        <div className="tikkit-login-art" aria-hidden="true">
          <div className="tikkit-sticker-frame">
            <div className="tikkit-sticker">
              <div className="tikkit-label text-sm">Kitchen order</div>
              <strong>TIK<br />KIT</strong>
              <div className="border-t-2 border-dashed border-brand-ink pt-3 tikkit-label text-xs">Counter · Kitchen</div>
            </div>
          </div>
        </div>
        <p className="font-medium text-sm">Restaurant point of sale</p>
      </div>

      <section className="tikkit-login-panel tikkit-card" aria-labelledby="login-title">
        <div className="mb-7">
          <h1 id="login-title" className="tikkit-heading text-4xl md:text-5xl">Welcome back</h1>
          <p className="text-sm text-brand-muted mt-3">Sign in with your restaurant staff account.</p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2 animate-shake">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {passwordUpdated && !errorMessage && <p role="status" className="mb-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          Password updated. Sign in with your new password.
        </p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="sign-in-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <input
                id="sign-in-email" name="email" autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500 text-gray-800 transition-colors"
                placeholder="name@daybreak.test"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="sign-in-password" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="sign-in-password" name="password" autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500 text-gray-800 transition-colors"
                placeholder="••••••••"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetStatus(null);
                setShowForgotModal(true);
              }}
              className="font-bold text-gray-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="tikkit-button tikkit-button-primary w-full mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <button type="button" onClick={() => { setEmail('admin@posbits.io'); setPassword('password123'); }}
            className="mt-4 text-xs font-semibold underline">Fill development demo login</button>
        )}
      </section>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-modal border border-gray-100 animate-scaleIn">
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your work email address to receive password reset instructions.
            </p>

            {resetStatus?.success ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{resetStatus.message}</span>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                {resetStatus && <p role="alert" className="text-xs text-red-700">{resetStatus.message}</p>}
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@daybreak.test"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-800 font-semibold text-center block"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
