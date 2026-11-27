'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase/client';

export function StaffInvitation({
  outlet,
  owner = false,
  canInviteManager = false,
}: {
  outlet: string;
  owner?: boolean;
  canInviteManager?: boolean;
}) {
  const [result,setResult] = useState('');
  const [link,setLink] = useState('');
  const [busy,setBusy] = useState(false);
  return <form className="grid gap-2 rounded border p-3 sm:grid-cols-2" onSubmit={async event => {
    event.preventDefault();
    setBusy(true); setLink(''); setResult('');
    const form = new FormData(event.currentTarget);
    try {
      const {data,error} = await supabase.rpc('invite_outlet_staff',{
        p_outlet:outlet,p_name:form.get('name'),p_email:form.get('email'),p_role:owner ? 'owner' : form.get('role')
      });
      if (error) throw error;
      setLink(window.location.origin + '/join#' + data);
      setResult('Share this invitation with the employee. It expires in 48 hours.');
    } catch {setResult('Could not create the invitation. Check your connection and outlet access.');}
    finally {setBusy(false);}
  }}>
    <h3 className="font-bold sm:col-span-2">{owner ? 'Invite outlet owner' : 'Invite staff'}</h3>
    <label>Name<input required name="name" maxLength={120} className="block w-full rounded border p-2"/></label>
    <label>Email<input required name="email" type="email" className="block w-full rounded border p-2"/></label>
    {!owner && (
      <label>
        Role
        <select name="role" className="block w-full rounded border p-2">
          {canInviteManager && <option value="manager">Store Manager</option>}
          <option value="cashier">Cashier</option>
          <option value="kitchen">Kitchen</option>
        </select>
      </label>
    )}
    <button disabled={busy} className="state-action">{busy ? 'Creating…' : 'Create invitation'}</button>
    {result && <p className="sm:col-span-2" role="status">{result}</p>}
    {link && <input className="sm:col-span-2 rounded border p-2" aria-label="Invitation link" value={link} readOnly onFocus={e=>e.target.select()}/>}
  </form>;
}
