'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { activateOutletWorkspace, refreshOutletWorkspace, useAppStore } from '@/store';
import { OutletAccessDenied } from '@/services/orderService';
import type { OutletAccess } from '@/lib/auth/operationalAccess';

export function OutletWorkspace({ access, children }: { access: OutletAccess; children: ReactNode }) {
  const [loadedOutlet, setLoadedOutlet] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const actionError = useAppStore((state) => state.operationalError);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    activateOutletWorkspace(access);
    const sync = async () => {
      try {
        await refreshOutletWorkspace(access.outletId);
        if (active) {
          setLoadedOutlet(access.outletId);
          setError('');
        }
      } catch (error) {
        if (active) {
          if (error instanceof OutletAccessDenied) setLoadedOutlet(null);
          setError(error instanceof Error ? error.message : 'Could not load the outlet.');
        }
      } finally {
        if (active) timer = setTimeout(sync, 3000);
      }
    };
    void sync();
    return () => { active = false; clearTimeout(timer); };
  }, [access, attempt]);

  return (
    <>
      {loadedOutlet === access.outletId ? <>
        {(error || actionError) && <aside role="alert" className="bg-amber-50 px-4 py-2">{error ? 'Updates paused. ' + error : actionError}
          {error && <button className="state-action ml-2" onClick={() => setAttempt(n => n+1)}>Reconnect</button>}</aside>}
        {children}
      </> : <main className="screen-state" role={error ? 'alert' : 'status'}>
        <h1>{error ? 'Outlet unavailable' : 'Opening ' + access.outletName + '…'}</h1>
        {error && <><p>{error}</p><button className="state-action" onClick={() => setAttempt(n => n+1)}>Try again</button>
          <a href="/login" className="state-action ml-2">Sign in</a></>}
      </main>}
    </>
  );
}
