'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { OUTLET_COOKIE } from '@/lib/auth/operationalAccess';

export async function switchOutlet(form: FormData) {
  const outlet = z.guid().safeParse(form.get('outlet'));
  if (!outlet.success) redirect('/access-denied');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase.rpc('get_pos_session', { p_outlet: outlet.data });
  if (error || !data) redirect('/access-denied');
  (await cookies()).set(OUTLET_COOKIE, outlet.data, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/',
  });
  redirect('/');
}
