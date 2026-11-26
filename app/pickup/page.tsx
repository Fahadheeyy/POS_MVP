'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Queue {
  outlet: string;
  tickets: {token: string; ready: boolean}[];
}

export default function PickupPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [status, setStatus] = useState('Loading pickup board…');
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function sync() {
      const key = window.location.hash.slice(1);
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(key)) {
        setQueue(null);
        setStatus('Open the display link from outlet settings.');
        return;
      }
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const {data, error} = await supabase.rpc('pickup_queue', {p_key: key}).abortSignal(controller.signal);
        if (!active) return;
        if (error) throw error;
        setQueue(data);
        setStatus(data ? '' : 'Display disconnected. Request a new link from the outlet.');
        if (!data) return;
      } catch {
        if (!active) return;
        setStatus('Reconnecting · order updates paused');
      } finally {
        clearTimeout(timeout);
      }
      if (active) timer = setTimeout(sync, 2500);
    }
    const reload = () => window.location.reload();
    window.addEventListener('hashchange', reload);
    void sync();
    return () => { active = false; controller?.abort(); clearTimeout(timer); window.removeEventListener('hashchange', reload); };
  }, []);
  return <main className="pickup-board">
    <header><h1>{queue?.outlet || 'Order pickup'}</h1></header>
    {status && <p className="screen-state" role="status">{status}</p>}
    {queue && <div className="pickup-lanes">{[false, true].map(ready => {
      const tickets = queue.tickets.filter(ticket => ticket.ready === ready);
      return <section key={String(ready)}><h2>{ready ? 'Ready for pickup' : 'Preparing'}</h2>
        {tickets.length ? <ul>{tickets.map(ticket => <li key={ticket.token}>{ticket.token.replace(/^Token\s*#/i, '')}</li>)}</ul>
          : <p>{ready ? 'Ready orders will appear here.' : 'No orders in preparation.'}</p>}
      </section>;
    })}</div>}
  </main>;
}
