'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { activateOutletWorkspace, refreshOutletWorkspace, useAppStore } from '@/store';
import { OutletAccessDenied, type OutletWorkspace as OutletWorkspaceData } from '@/services/orderService';
import type { OutletAccess } from '@/lib/auth/operationalAccess';

function pollIntervalMs(pathname: string): number {
  if (pathname.startsWith('/kds')) return 5000;
  if (pathname.startsWith('/pos') || pathname.startsWith('/orders')) return 12000;
  return 45000;
}

export function OutletWorkspace({
  access,
  initialWorkspace = null,
  children,
}: {
  access: OutletAccess;
  initialWorkspace?: OutletWorkspaceData | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [loadedOutlet, setLoadedOutlet] = useState<string | null>(() => {
    if (initialWorkspace) {
      activateOutletWorkspace(access, initialWorkspace);
      return access.outletId;
    }
    return null;
  });
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const actionError = useAppStore((state) => state.operationalError);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    activateOutletWorkspace(access, initialWorkspace);
    if (initialWorkspace) {
      setLoadedOutlet(access.outletId);
    }

    const baseInterval = pollIntervalMs(pathname);
    const scheduleNext = () => {
      if (!active) return;
      const jitter = Math.round(baseInterval * (0.85 + Math.random() * 0.3));
      timer = setTimeout(sync, jitter);
    };

    const sync = async () => {
      if (!active) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        scheduleNext();
        return;
      }
      try {
        await refreshOutletWorkspace(access.outletId);
        if (active) {
          setLoadedOutlet(access.outletId);
          setError('');
        }
      } catch (err) {
        if (active) {
          if (err instanceof OutletAccessDenied) setLoadedOutlet(null);
          setError(err instanceof Error ? err.message : 'Could not load the outlet.');
        }
      } finally {
        scheduleNext();
      }
    };

    if (initialWorkspace) {
      // Already hydrated synchronously from Server Component; start background cadence cleanly.
      scheduleNext();
    } else {
      void sync();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        void sync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [access, initialWorkspace, pathname, attempt]);

  return (
    <>
      {loadedOutlet === access.outletId ? (
        <>
          {(error || actionError) && (
            <aside role="alert" className="bg-amber-50 px-4 py-2">
              {error ? 'Updates paused. ' + error : actionError}
              {error && (
                <button className="state-action ml-2" onClick={() => setAttempt((n) => n + 1)}>
                  Reconnect
                </button>
              )}
            </aside>
          )}
          {children}
        </>
      ) : (
        <main className="screen-state" role={error ? 'alert' : 'status'}>
          <h1>{error ? 'Outlet unavailable' : 'Opening ' + access.outletName + '…'}</h1>
          {error && (
            <>
              <p>{error}</p>
              <button className="state-action" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
              <a href="/login" className="state-action ml-2">
                Sign in
              </a>
            </>
          )}
        </main>
      )}
    </>
  );
}
