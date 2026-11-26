'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function PickupDisplaySettings({outlet}: {outlet: string}) {
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function manage(action: 'open' | 'disable') {
    setBusy(true);
    setMessage('');
    try {
      const {data, error} = await supabase.rpc('manage_pickup_display', {p_outlet: outlet, p_action: action});
      if (error) throw error;
      setLink(data ? window.location.origin + '/pickup#' + data : '');
      setMessage(data ? 'Open this link in the pickup screen’s browser.' : 'Display link disabled.');
    } catch {
      setMessage('Could not update the display link. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  return <section className="space-y-3"><h3 className="text-lg font-bold">Customer pickup screen</h3>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="state-action" disabled={busy} onClick={() => manage('open')}>Get display link</button>
      <button type="button" className="state-action" disabled={busy} onClick={() => manage('disable')}>Disable display link</button>
    </div>
    <p role="status">{message}</p>
    {link && <><input aria-label="Pickup display link" className="w-full rounded border p-2" readOnly value={link} onFocus={event => event.target.select()}/>
      <a className="state-action" href={link} target="_blank" rel="noreferrer">Open pickup screen</a></>}
  </section>;
}
