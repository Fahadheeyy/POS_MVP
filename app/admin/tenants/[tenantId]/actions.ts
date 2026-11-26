'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const fields = z.object({
  reason: z.string().trim().min(1).max(500),
});
const configuration = z.discriminatedUnion('operation', [
  fields.extend({
    operation: z.literal('outlet.created'),
    code: z.string().trim().regex(/^[A-Z0-9][A-Z0-9-]{0,23}$/),
    name: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(240),
    city: z.string().trim().min(1).max(120),
    state: z.string().regex(/^[0-9]{2}$/),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/),
    email: z.email().max(254),
    fssai: z.string().regex(/^[0-9]{14}$/),
  }),
  fields.extend({
    operation: z.literal('outlet.status_changed'),
    outletId: z.guid(),
    status: z.enum(['active', 'temporarily_closed', 'archived']),
  }),
  fields.extend({
    operation: z.literal('subscription.plan_changed'),
    plan: z.string().min(1).max(120),
  }),
  fields.extend({
    operation: z.literal('feature.override_changed'),
    feature: z.string().min(1).max(120),
    mode: z.enum(['enabled', 'disabled', 'inherit']),
  }),
]);

export async function configureTenant(tenantId: string, formData: FormData) {
  if (!z.guid().safeParse(tenantId).success) redirect('/admin');
  const path = `/admin/tenants/${tenantId}`;
  const input = configuration.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(`${path}?error=invalid`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { operation, reason, ...values } = input.data;
  const { error } = await supabase.rpc('configure_platform_tenant', {
    p_tenant_id: tenantId,
    p_operation: operation,
    p_values: values,
    p_reason: reason,
  });
  if (error?.code === '42501') redirect('/access-denied');
  if (error?.code === '23505') redirect(`${path}?error=duplicate`);
  if (error) redirect(`${path}?error=save`);

  revalidatePath(path);
  redirect(`${path}?saved=1`);
}
