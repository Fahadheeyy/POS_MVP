import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function resetPassword(form: FormData) {
  'use server';
  const password = form.get('password');
  const confirmation = form.get('confirmation');
  if (typeof password !== 'string' || password.length < 8 || password !== confirmation) {
    redirect('/auth/reset?error=password');
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?error=recovery');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/auth/reset?error=save');
  await supabase.auth.signOut();
  redirect('/login?reset=success');
}

export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?error=recovery');
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-5 text-xl font-bold">Choose a new password</h1>
      {error && <p role="alert" className="text-red-700">{error === 'save'
        ? 'The password could not be saved. Check that it meets the password requirements and try again.'
        : 'Use matching passwords of at least eight characters and try again.'}</p>}
      <form action={resetPassword} className="grid gap-4">
        <label>New password<input className="block w-full rounded border p-2" type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
        <label>Confirm password<input className="block w-full rounded border p-2" type="password" name="confirmation" autoComplete="new-password" minLength={8} required /></label>
        <button className="rounded bg-slate-900 p-2 text-white">Update password</button>
      </form>
    </main>
  );
}
