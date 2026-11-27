'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { createAdminClient } from '@/lib/supabase/admin';

const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  password: z.string().min(6).max(200),
  phone: z.string().trim().max(20).optional().default(''),
  title: z.string().trim().max(80).optional().default(''),
  role: z.enum(['manager', 'cashier', 'kitchen']),
  pin: z.string().regex(/^[0-9]{4}$/).optional().default('1234'),
});

export async function createOutletStaffAction(
  rawInput: z.input<typeof createStaffSchema>
): Promise<{ success: boolean; error?: string }> {
  const access = await requireOperationalAccess('staff.manage');
  const parsed = createStaffSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Check all staff details.' };
  }

  const d = parsed.data;
  const canCreateManager = access.role === 'owner' || access.title === 'Platform Super Admin';
  if (d.role === 'manager' && !canCreateManager) {
    return { success: false, error: 'Only an outlet owner can add a Store Manager.' };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Direct account creation requires SUPABASE_SERVICE_ROLE_KEY on the server. Use the invite link instead.' };
  }

  const admin = createAdminClient();
  const normalizedEmail = d.email.trim().toLowerCase();

  // Create or update Auth account
  let authUserId: string;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: d.password,
    email_confirm: true,
    user_metadata: { name: d.name },
  });

  if (createErr) {
    const { data: listRes } = await admin.auth.admin.listUsers({ perPage: 500 });
    const users = (listRes?.users ?? []) as Array<{ id: string; email?: string }>;
    const existing = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (!existing) {
      return { success: false, error: createErr.message || 'Could not create auth account.' };
    }
    await admin.auth.admin.updateUserById(existing.id, { password: d.password, email_confirm: true });
    authUserId = existing.id;
  } else {
    authUserId = created.user.id;
  }

  const { data: roleRow } = await admin
    .from('roles')
    .select('id')
    .eq('code', d.role)
    .is('tenant_id', null)
    .single();
  if (!roleRow) {
    return { success: false, error: 'Role definition not found.' };
  }

  const defaultTitle =
    d.title || (d.role === 'manager' ? 'Store Manager' : d.role === 'kitchen' ? 'Kitchen Staff' : 'Cashier');
  const initials = d.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .upsert(
      {
        auth_user_id: authUserId,
        email: normalizedEmail,
        name: d.name,
        phone: d.phone || null,
        avatar_initials: initials,
        title: defaultTitle,
        is_active: true,
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();

  if (profErr || !profile) {
    return { success: false, error: profErr?.message || 'Could not save staff profile.' };
  }

  await admin.from('tenant_memberships').upsert(
    {
      tenant_id: access.tenantId,
      profile_id: profile.id,
      is_owner: false,
    },
    { onConflict: 'tenant_id,profile_id' }
  );

  await admin.from('outlet_memberships').upsert(
    {
      outlet_id: access.outletId,
      profile_id: profile.id,
      role_id: roleRow.id,
      is_primary: true,
      status: 'active',
    },
    { onConflict: 'outlet_id,profile_id' }
  );

  const pinHash = await bcrypt.hash(d.pin, 10);
  await admin.from('staff_pins').upsert(
    {
      profile_id: profile.id,
      outlet_id: access.outletId,
      pin_hash: pinHash,
    },
    { onConflict: 'profile_id,outlet_id' }
  );

  await admin.from('audit_logs').insert({
    tenant_id: access.tenantId,
    outlet_id: access.outletId,
    action: 'staff.created',
    entity_type: 'profile',
    entity_id: profile.id,
    new_values: { email: normalizedEmail, role: d.role, name: d.name },
    metadata: { actor_role: access.role },
  });

  revalidatePath('/manager');
  return { success: true };
}
