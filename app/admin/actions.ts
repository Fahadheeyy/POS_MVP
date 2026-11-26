'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const reason = z.string().trim().min(1).max(500);
const newTenant = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  reason,
});
const tenantStatus = z.object({
  tenantId: z.guid(),
  status: z.enum(['onboarding', 'active', 'suspended', 'archived']),
  reason,
});

export async function signOutPlatformAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  (await cookies()).delete('pos_session');
  redirect('/login');
}

async function saveTenant(params: {
  p_tenant_id: string | null;
  p_name: string | null;
  p_slug: string | null;
  p_status: string | null;
  p_reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.rpc('manage_platform_tenant', params);
  if (error?.code === '42501') redirect('/access-denied');
  if (error?.code === '23505') redirect('/admin?error=duplicate');
  if (error) redirect('/admin?error=save');

  revalidatePath('/admin');
  redirect('/admin');
}

export async function createTenant(formData: FormData) {
  const input = newTenant.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect('/admin?error=invalid');

  const { name, slug, reason } = input.data;
  await saveTenant({
    p_tenant_id: null, p_name: name, p_slug: slug, p_status: null, p_reason: reason,
  });
}

export async function updateTenantStatus(formData: FormData) {
  const input = tenantStatus.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect('/admin?error=invalid');

  const { tenantId, status, reason } = input.data;
  await saveTenant({
    p_tenant_id: tenantId, p_name: null, p_slug: null, p_status: status, p_reason: reason,
  });
}
