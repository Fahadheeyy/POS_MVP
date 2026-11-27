"use client";
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, LogIn, SearchX } from 'lucide-react';

export function TikkitLoadingScreen({
  title = 'Opening workspace…',
  subtitle = 'Syncing live menu, orders, and outlet session',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <main
      className="min-h-[100dvh] bg-brand-oat flex flex-col items-center justify-center p-4 sm:p-6 select-none"
      role="status"
      aria-live="polite"
    >
      <div className="tikkit-card w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-5">
        <div className="flex items-center justify-center gap-3">
          <span className="tikkit-wordmark text-2xl sm:text-3xl">TIKKIT</span>
          <span className="w-6 h-6 rounded-full border-[3px] border-brand-ink border-t-brand-orange animate-spin" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-sans font-bold text-lg sm:text-xl text-brand-ink">{title}</h1>
          <p className="text-xs sm:text-sm text-brand-muted">{subtitle}</p>
        </div>

        <div className="space-y-2.5 pt-1" aria-hidden="true">
          <div className="h-3 w-full rounded-full bg-brand-rule/60 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-brand-orange animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-xl bg-white/70 border border-brand-rule/60 animate-pulse" />
            <div className="h-12 rounded-xl bg-white/70 border border-brand-rule/60 animate-pulse" />
            <div className="h-12 rounded-xl bg-white/70 border border-brand-rule/60 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function TikkitErrorScreen({
  title = 'Something went wrong',
  message = 'Check your internet connection or refresh this screen to try again.',
  onRetry,
  homeHref = '/',
  homeLabel = 'Back to workspace',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <main
      className="min-h-[100dvh] bg-brand-oat flex flex-col items-center justify-center p-4 sm:p-6 select-none"
      role="alert"
    >
      <div className="tikkit-card w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 border-2 border-brand-ink flex items-center justify-center text-red-700 shadow-[2px_3px_0px_#161412]">
          <AlertTriangle size={26} />
        </div>

        <div className="space-y-2">
          <h1 className="font-sans font-bold text-xl text-brand-ink">{title}</h1>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-[#FF6333] text-brand-ink border-2 border-brand-ink shadow-[2px_3px_0px_#161412] text-xs font-extrabold inline-flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
            >
              <RefreshCw size={14} />
              <span>Try again</span>
            </button>
          )}
          <Link
            href={homeHref}
            className="flex-1 py-2.5 px-4 rounded-xl border-2 border-brand-ink bg-white/80 hover:bg-white text-brand-ink text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={14} />
            <span>{homeLabel}</span>
          </Link>
        </div>

        <div className="pt-1">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-ink underline">
            <LogIn size={13} />
            <span>Sign in with a different account</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export function TikkitNotFoundScreen() {
  return (
    <main className="min-h-[100dvh] bg-brand-oat flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="tikkit-card w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-mustard border-2 border-brand-ink flex items-center justify-center text-brand-ink shadow-[2px_3px_0px_#161412]">
          <SearchX size={26} />
        </div>

        <div className="space-y-1.5">
          <p className="tikkit-label text-[11px] text-brand-muted">Error 404</p>
          <h1 className="font-sans font-bold text-xl text-brand-ink">Page not found</h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            This screen does not exist or moved to a different route.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-ink text-brand-paper text-xs font-bold inline-flex items-center justify-center gap-2 shadow-[2px_3px_0px_#FF4F1A]"
          >
            <Home size={14} />
            <span>Return to workspace</span>
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 rounded-xl border-2 border-brand-ink bg-white/80 hover:bg-white text-brand-ink text-xs font-bold inline-flex items-center justify-center gap-2"
          >
            <LogIn size={14} />
            <span>Go to Sign In</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
