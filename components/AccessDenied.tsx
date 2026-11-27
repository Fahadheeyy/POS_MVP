import Link from 'next/link';
import { Home, Lock, LogIn } from 'lucide-react';

export function AccessDenied() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-brand-oat select-none">
      <div className="tikkit-card rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 border-2 border-brand-ink flex items-center justify-center text-red-700 shadow-[2px_3px_0px_#161412]">
          <Lock size={26} />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-sans text-xl font-bold text-brand-ink">Access restricted</h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Your outlet assignment does not grant access to this page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-ink text-brand-paper text-xs font-bold inline-flex items-center justify-center gap-2 shadow-[2px_3px_0px_#FF4F1A]"
          >
            <Home size={14} />
            <span>My workspace</span>
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 rounded-xl border-2 border-brand-ink bg-white/80 hover:bg-white text-brand-ink text-xs font-bold inline-flex items-center justify-center gap-2"
          >
            <LogIn size={14} />
            <span>Switch account</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
