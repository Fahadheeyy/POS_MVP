'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase/client';

export default function JoinPage() {
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).has('expired')) setMessage('This invitation expired or belongs to another address. Ask your manager for a new link.');
  }, []);
  return <main className="mx-auto max-w-md p-6"><h1 className="tikkit-heading text-2xl">Join your outlet</h1>
    <form className="mt-4 grid gap-3" onSubmit={async event => {
      event.preventDefault();
      const token = location.hash.slice(1);
      if (!/^[0-9a-f-]{36}$/i.test(token)) {setMessage('Open the full invitation link from your manager.');return;}
      const email = String(new FormData(event.currentTarget).get('email')).trim();
      setBusy(true);
      try {
        const {error} = await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin + '/auth/callback?invite=' + token}});
        setMessage(error ? 'Could not send the email. Try again shortly.' : 'Check your email on this browser to finish joining.');
      } catch {setMessage('Check your connection and try again.');}
      finally {setBusy(false);}
    }}>
      <label>Invited email address<input required type="email" name="email" className="block w-full rounded border p-2"/></label>
      <button disabled={busy} className="state-action">Send sign-in link</button>
      <p role="status">{message}</p>
    </form>
  </main>;
}
