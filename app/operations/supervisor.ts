'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getOperationalAccess } from '@/lib/auth/operationalAccess';

const approvalSchema = z.object({
  orderId: z.guid(),
  email: z.email().max(254),
  password: z.string().min(1).max(1024),
  reason: z.string().trim().min(1).max(500),
  reference: z.string().trim().max(80),
  cancelTicket: z.boolean(),
});

export async function approveRefund(input: z.input<typeof approvalSchema>): Promise<{ error?: string }> {
  const validated = approvalSchema.safeParse(input);
  if (!validated.success) return { error: 'Enter the supervisor credentials and a refund reason.' };
  const access = await getOperationalAccess();
  const { email, password, orderId, reason, reference, cancelTicket } = validated.data;
  if (!access || !access.effectivePermissions.includes(cancelTicket ? 'kds.access' : 'orders.view')) {
    return { error: 'This workspace does not grant access to this operation.' };
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: 'Supervisor sign-in failed. Check the credentials and try again.' };

  try {
    const { error } = await supabase.rpc('pos_refund', {
      p_order: orderId, p_reason: reason, p_reference: reference, p_outlet: access.outletId, p_cancel_ticket: cancelTicket,
    });
    if (error?.code === 'P0001' || error?.code === '42501') return { error: error.message };
    if (error) return { error: 'Could not record the refund. Check the order before retrying.' };
    return {};
  } finally {
    await supabase.auth.signOut({ scope: 'local' });
  }
}
