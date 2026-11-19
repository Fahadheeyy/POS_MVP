"use client";
import React, { useState } from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAppStore } from '../../store';
import { authService, AuthSessionUser } from '@/lib/auth/authService';
import { sounds } from '../../utils/audio';
import { TikkitLogo } from '@/components/TikkitLogo';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, setCurrentRole, switchActiveBusiness, currentUser, businesses } = useAppStore();

  const [email, setEmail] = useState('alex@signlaban.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

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
      setCurrentRole(user.role);

      // If user is tied to a specific outlet, switch the active store business
      if (user.outletId) {
        switchActiveBusiness(user.outletId);
      }

      if (typeof document !== 'undefined') {
        document.cookie = `pos_session=${encodeURIComponent(
          JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            outletId: user.outletId,
          })
        )}; path=/; max-age=86400; SameSite=Lax`;
      }

      // Route based on user's authorized role & permissions
      let targetRoute = '/pos';
      if (user.role === 'admin') {
        targetRoute = '/admin';
      } else if (user.role === 'owner') {
        targetRoute = '/owner';
      } else if (user.role === 'manager') {
        targetRoute = '/manager';
      } else if (user.role === 'kitchen') {
        targetRoute = '/kds';
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

  const handleQuickFill = (demoEmail: string, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage(null);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    const res = await authService.sendPasswordReset(resetEmail);
    setResetStatus(res.message);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row select-none">
      {/* Left Column with Soft Blue-Gray Card (Preserving Exact Visual Identity) */}
      <div className="md:w-1/2 p-8 flex flex-col justify-between bg-surface-canvas border-r border-gray-200">
        <div className="flex items-center gap-3">
          <TikkitLogo variant="header" size="md" />
          <div className="border-l border-gray-200 pl-3 flex items-center gap-2">
            <span className="font-extrabold text-gray-900 text-xs">Sign Laban</span>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-slate-600 text-xs font-semibold">India's First Egyptian Dessert</span>
          </div>
        </div>

        <div className="my-auto max-w-md mx-auto w-full py-6">
          {/* Authentic Brand Hero Card */}
          <div className="w-full h-88 rounded-3xl bg-gradient-to-br from-[#bac7d5] to-[#cbd7e3] border border-gray-300/40 p-8 flex flex-col justify-between relative overflow-hidden shadow-subtle">
            {/* Top brand badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#556475] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                SIGN LABAN
              </span>
              <span className="text-[11px] font-medium text-slate-700 bg-white/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Indiranagar, Bengaluru
              </span>
            </div>

            {/* Product Graphic Center */}
            <div className="my-auto relative flex items-center justify-center py-4">
              <div className="absolute w-48 h-48 rounded-full bg-white/40 blur-lg" />
              <img
                src="/assets/products/sign_laban/SAANKORITA.png"
                alt="Saankorita Egyptian Dessert"
                className="h-44 w-auto object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Bottom Tagline Glass Panel */}
            <div className="bg-white/75 backdrop-blur-md -mx-8 -mb-8 p-6 rounded-b-3xl border-t border-white/60 relative z-10">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                India's First Egyptian Dessert
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Authentic Qashtuta, Umm Ali, Koushiri & Saankorita sweets powered by high-speed counter operations.
              </p>
              <div className="w-16 h-1 bg-[#556475] rounded-full" />
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
          <span>Enterprise Multi-Tenant SaaS · Bengaluru KA</span>
          <span className="flex items-center gap-1 text-slate-600 font-semibold">
            <ShieldCheck size={14} className="text-emerald-600" />
            Supabase SSR Auth Protected
          </span>
        </div>
      </div>

      {/* Right Column: Secure Email & Password Login */}
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Active Session Notification */}
        {currentUser && (
          <div className="mb-6 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">
                Active session: <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <button
              onClick={() => {
                let target = '/pos';
                if (currentUser.role === 'admin') target = '/admin';
                else if (currentUser.role === 'owner') target = '/owner';
                else if (currentUser.role === 'manager') target = '/manager';
                else if (currentUser.role === 'kitchen') target = '/kds';
                navigate(target);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shrink-0"
            >
              Continue →
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-brand-500" />
            Enterprise Staff Authentication
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in with your registered restaurant employee or franchise owner account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2 animate-shake">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500 text-gray-800 transition-colors"
                placeholder="name@signlaban.in"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
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
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-0"
              />
              <span>Keep me signed in</span>
            </label>
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
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 font-bold text-sm border border-gray-300 shadow-subtle transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Quick Testing Accounts Section */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
            Quick Sign-In (Verified Roles)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { role: 'Cashier', email: 'priya@signlaban.in', name: 'Priya (Counter)' },
              { role: 'Kitchen', email: 'jesselyn@signlaban.in', name: 'Jesselyn (KDS)' },
              { role: 'Manager', email: 'alex@signlaban.in', name: 'Alex (Store)' },
              { role: 'Owner', email: 'vikram@signlaban.in', name: 'Vikram (Owner)' },
              { role: 'Admin', email: 'admin@posbits.io', name: 'Dev Ops (Admin)' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                  email === acc.email
                    ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {acc.name}
              </button>
            ))}
          </div>

          {/* Onboarded Outlets Quick Login List */}
          {businesses && businesses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2">
                <span className="uppercase tracking-wider">All Outlets & Owners ({businesses.length})</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Admin Portal →
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() =>
                      handleQuickFill(biz.ownerEmail || 'owner@outlet.in', biz.ownerPassword || 'password123')
                    }
                    className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      email === biz.ownerEmail
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: biz.themeColor || '#556475' }}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate leading-tight">{biz.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {biz.ownerEmail || 'No email set'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-gray-100 shrink-0">
                      {biz.ownerName?.split(' ')[0] || 'Owner'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-2">
            Clicking fills credentials to execute through real authentication & effective permission checks.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-modal border border-gray-100 animate-scaleIn">
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your work email address to receive password reset instructions.
            </p>

            {resetStatus ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{resetStatus}</span>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@signlaban.in"
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
    </div>
  );
};
