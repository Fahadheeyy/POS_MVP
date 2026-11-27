'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OUTLET_COOKIE } from '@/lib/auth/operationalAccess';

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

const outletFeaturesSchema = z.object({
  kdsEnabled: z.boolean().default(true),
  gstEnabled: z.boolean().default(true),
  gstRate: z.number().min(0).max(28).default(5),
  addOnsEnabled: z.boolean().default(true),
  autoPrintReceipt: z.boolean().default(false),
  cashTiming: z.enum(['before', 'after']).default('before'),
  tableManagement: z.boolean().default(true),
  receiptHeader: z.string().max(400).default(''),
  receiptFooter: z.string().max(400).default(''),
  wifiPassword: z.string().max(120).default(''),
  enabledPayments: z.object({
    cash: z.boolean().default(true),
    upi: z.boolean().default(true),
    card: z.boolean().default(true),
  }).default({ cash: true, upi: true, card: true }),
});

const outletFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brandName: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80),
  category: z.string().trim().max(80).default('QSR'),
  tagline: z.string().trim().max(240).default(''),
  address: z.string().trim().min(1).max(240),
  city: z.string().trim().min(1).max(120),
  pincode: z.string().trim().max(10).default('560034'),
  phone: z.string().trim().min(6).max(20),
  email: z.email().max(254),
  planTier: z.enum(['trial', 'starter', 'growth', 'enterprise']).default('growth'),
  themeColor: z.string().trim().max(20).default('#FF4F1A'),
  stateCode: z.string().regex(/^[0-9]{2}$/).default('29'),
  legalEntityName: z.string().trim().max(180).default(''),
  gstin: z.string().trim().max(15).default(''),
  fssai: z.string().trim().max(14).default(''),
  serviceChargePercent: z.number().min(0).max(25).default(0),
  isCompositionScheme: z.boolean().default(false),
  tableCount: z.number().int().min(0).max(100).default(16),
  kdsTargetMinutes: z.number().int().min(1).max(60).default(7),
  upiVpaId: z.string().trim().max(120).default(''),
  ownerPin: z.string().regex(/^[0-9]{4}$/).default('8888'),
  features: outletFeaturesSchema,
});

const onboardOwnerSchema = outletFieldsSchema.extend({
  ownerName: z.string().trim().min(1).max(120),
  ownerPhone: z.string().trim().max(20).default(''),
  ownerEmail: z.email().max(254),
  ownerPassword: z.string().min(6).max(200),
});

const addOutletSchema = outletFieldsSchema.extend({
  tenantId: z.guid(),
  ownerProfileId: z.guid().optional().nullable(),
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' as const, supabase: null, user: null };
  const { data: allowed, error } = await supabase.rpc('is_platform_super_admin');
  if (error || allowed !== true) return { error: 'Platform super admin access required' as const, supabase: null, user: null };
  return { error: null, supabase, user };
}

export async function signOutPlatformAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  (await cookies()).delete('pos_session');
  (await cookies()).delete(OUTLET_COOKIE);
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

function buildPreferencesPayload(input: z.infer<typeof outletFieldsSchema>) {
  return {
    themeColor: input.themeColor,
    upiVpaId: input.upiVpaId,
    kdsTargetMinutes: input.kdsTargetMinutes,
    ownerPinDisplay: input.ownerPin,
    kdsEnabled: input.features.kdsEnabled,
    isGstEnabled: input.features.gstEnabled,
    gstRate: input.features.gstRate,
    addOnsEnabled: input.features.addOnsEnabled,
    autoPrintReceipt: input.features.autoPrintReceipt,
    cashTiming: input.features.cashTiming,
    tableManagement: input.features.tableManagement,
    receiptHeader: input.features.receiptHeader,
    receiptFooter: input.features.receiptFooter,
    wifiPassword: input.features.wifiPassword,
    enabledPayments: input.features.enabledPayments,
    showWifiOnReceipt: Boolean(input.features.wifiPassword),
  };
}

export async function onboardOwnerAndOutletAction(
  rawInput: z.input<typeof onboardOwnerSchema>
): Promise<{ success: boolean; error?: string; outletId?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.user) return { success: false, error: auth.error || 'Unauthorized' };

  const parsed = onboardOwnerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Check all required owner and outlet fields.' };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' };
  }

  const d = parsed.data;
  const admin = createAdminClient();
  const normalizedEmail = d.ownerEmail.trim().toLowerCase();
  const cleanSlug = d.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || `tenant-${Date.now()}`;
  const outletCode = (cleanSlug.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'OUT') + '-' + Math.floor(10 + Math.random() * 89);

  // 1. Create or retrieve Supabase Auth user
  let authUserId: string | null = null;
  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: d.ownerPassword,
    email_confirm: true,
    user_metadata: { name: d.ownerName },
  });

  if (createAuthError) {
    // If user already exists, update password and reuse
    const { data: listRes } = await admin.auth.admin.listUsers({ perPage: 200 });
    const users = (listRes?.users ?? []) as Array<{ id: string; email?: string }>;
    const existingAuth = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (!existingAuth) {
      return { success: false, error: createAuthError.message || 'Could not create owner login account.' };
    }
    await admin.auth.admin.updateUserById(existingAuth.id, { password: d.ownerPassword, email_confirm: true });
    authUserId = existingAuth.id;
  } else {
    authUserId = createdAuth.user.id;
  }

  // 2. Resolve state & subscription plan
  const [{ data: stateRow }, { data: plans }, { data: ownerRole }] = await Promise.all([
    admin.from('states').select('id, code').eq('code', d.stateCode).maybeSingle(),
    admin.from('subscription_plans').select('id, code'),
    admin.from('roles').select('id').eq('code', 'owner').is('tenant_id', null).single(),
  ]);

  const targetPlanCode = d.planTier === 'trial' ? 'starter' : d.planTier;
  const planId = plans?.find((p) => p.code === targetPlanCode)?.id || plans?.[0]?.id;
  if (!planId || !ownerRole) {
    return { success: false, error: 'Reference plan or owner role not found in database.' };
  }

  // 3. Create Tenant
  const { data: tenant, error: tenantErr } = await admin.from('tenants').insert({
    slug: `${cleanSlug}-${Math.floor(100 + Math.random() * 899)}`,
    name: d.brandName,
    legal_name: d.legalEntityName || d.brandName,
    brand_name: d.brandName,
    category: d.category || 'QSR',
    status: 'active',
    metadata: { themeColor: d.themeColor },
  }).select('id').single();

  if (tenantErr || !tenant) {
    return { success: false, error: tenantErr?.message || 'Failed to create tenant.' };
  }

  await admin.from('tenant_subscriptions').insert({
    tenant_id: tenant.id,
    plan_id: planId,
    status: d.planTier === 'trial' ? 'trialing' : 'active',
  });

  // 4. Create First Outlet
  const { data: outlet, error: outletErr } = await admin.from('outlets').insert({
    tenant_id: tenant.id,
    name: d.name,
    code: outletCode,
    is_default: true,
    status: 'active',
    address_line1: d.address,
    city: d.city,
    state_id: stateRow?.id ?? null,
    pincode: d.pincode || '560034',
    phone: d.phone,
    email: d.email,
  }).select('id').single();

  if (outletErr || !outlet) {
    return { success: false, error: outletErr?.message || 'Failed to create outlet.' };
  }

  // 5. Business Profile, GST, Preferences, Tables
  await admin.from('outlet_business_profiles').insert({
    outlet_id: outlet.id,
    fssai_number: /^[0-9]{14}$/.test(d.fssai) ? d.fssai : null,
    tagline: d.tagline,
    receipt_header: d.features.receiptHeader || d.name,
    receipt_footer: d.features.receiptFooter || 'Thank you for visiting!',
    service_charge_percent: d.serviceChargePercent,
    service_charge_enabled: d.serviceChargePercent > 0,
  });

  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(d.gstin.toUpperCase())) {
    await admin.from('outlet_gst_registrations').insert({
      outlet_id: outlet.id,
      gstin: d.gstin.toUpperCase(),
      trade_name: d.name,
      legal_name: d.legalEntityName || d.brandName,
      composition_scheme: d.isCompositionScheme,
      state_code: d.stateCode,
      registered_address: `${d.address}, ${d.city}`,
    });
  }

  await admin.from('pos_preferences').insert({
    outlet_id: outlet.id,
    settings: buildPreferencesPayload(d),
  });

  const tablesCount = d.features.tableManagement ? d.tableCount : 0;
  if (tablesCount > 0) {
    const tableRows = Array.from({ length: tablesCount }, (_, i) => ({
      tenant_id: tenant.id,
      outlet_id: outlet.id,
      name: `T-${String(i + 1).padStart(2, '0')}`,
      section: 'Main Dining',
      capacity: 4,
      status: 'vacant',
    }));
    await admin.from('dining_tables').insert(tableRows);
  }

  // 6. Link Owner Profile, Tenant Membership, Outlet Membership & PIN
  const initials = d.ownerName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'OW';
  const { data: profile, error: profErr } = await admin.from('profiles').upsert({
    auth_user_id: authUserId,
    email: normalizedEmail,
    name: d.ownerName,
    phone: d.ownerPhone || d.phone,
    avatar_initials: initials,
    title: 'Franchise Owner',
    is_active: true,
  }, { onConflict: 'email' }).select('id').single();

  if (profErr || !profile) {
    return { success: false, error: profErr?.message || 'Failed to create owner profile.' };
  }

  await admin.from('tenant_memberships').upsert({
    tenant_id: tenant.id,
    profile_id: profile.id,
    is_owner: true,
  }, { onConflict: 'tenant_id,profile_id' });

  await admin.from('outlet_memberships').upsert({
    outlet_id: outlet.id,
    profile_id: profile.id,
    role_id: ownerRole.id,
    is_primary: true,
    status: 'active',
  }, { onConflict: 'outlet_id,profile_id' });

  const pinHash = await bcrypt.hash(d.ownerPin, 10);
  await admin.from('staff_pins').upsert({
    profile_id: profile.id,
    outlet_id: outlet.id,
    pin_hash: pinHash,
  }, { onConflict: 'profile_id,outlet_id' });

  await admin.from('audit_logs').insert({
    tenant_id: tenant.id,
    outlet_id: outlet.id,
    action: 'tenant.onboarded',
    entity_type: 'outlet',
    entity_id: outlet.id,
    new_values: { ownerEmail: normalizedEmail, outletName: d.name, planTier: d.planTier },
    metadata: { auth_user_id: auth.user.id, reason: 'Platform admin onboarded owner and first outlet' },
  });

  revalidatePath('/admin');
  return { success: true, outletId: outlet.id };
}

export async function addOutletToTenantAction(
  rawInput: z.input<typeof addOutletSchema>
): Promise<{ success: boolean; error?: string; outletId?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.user) return { success: false, error: auth.error || 'Unauthorized' };

  const parsed = addOutletSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Check all required outlet fields.' };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' };
  }

  const d = parsed.data;
  const admin = createAdminClient();
  const cleanCode = (d.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'BR') + '-' + Math.floor(10 + Math.random() * 89);

  const [{ data: stateRow }, { data: plans }, { data: ownerRole }] = await Promise.all([
    admin.from('states').select('id').eq('code', d.stateCode).maybeSingle(),
    admin.from('subscription_plans').select('id, code'),
    admin.from('roles').select('id').eq('code', 'owner').is('tenant_id', null).single(),
  ]);

  const { data: outlet, error: outletErr } = await admin.from('outlets').insert({
    tenant_id: d.tenantId,
    name: d.name,
    code: cleanCode,
    is_default: false,
    status: 'active',
    address_line1: d.address,
    city: d.city,
    state_id: stateRow?.id ?? null,
    pincode: d.pincode || '560034',
    phone: d.phone,
    email: d.email,
  }).select('id').single();

  if (outletErr || !outlet) {
    return { success: false, error: outletErr?.message || 'Failed to add outlet.' };
  }

  await admin.from('outlet_business_profiles').insert({
    outlet_id: outlet.id,
    fssai_number: /^[0-9]{14}$/.test(d.fssai) ? d.fssai : null,
    tagline: d.tagline,
    receipt_header: d.features.receiptHeader || d.name,
    receipt_footer: d.features.receiptFooter || 'Thank you for visiting!',
    service_charge_percent: d.serviceChargePercent,
    service_charge_enabled: d.serviceChargePercent > 0,
  });

  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(d.gstin.toUpperCase())) {
    await admin.from('outlet_gst_registrations').insert({
      outlet_id: outlet.id,
      gstin: d.gstin.toUpperCase(),
      trade_name: d.name,
      legal_name: d.legalEntityName || d.brandName,
      composition_scheme: d.isCompositionScheme,
      state_code: d.stateCode,
      registered_address: `${d.address}, ${d.city}`,
    });
  }

  await admin.from('pos_preferences').insert({
    outlet_id: outlet.id,
    settings: buildPreferencesPayload(d),
  });

  const targetPlanCode = d.planTier === 'trial' ? 'starter' : d.planTier;
  const planId = plans?.find((p) => p.code === targetPlanCode)?.id;
  if (planId) {
    await admin.from('tenant_subscriptions').upsert({
      tenant_id: d.tenantId,
      plan_id: planId,
      status: d.planTier === 'trial' ? 'trialing' : 'active',
    }, { onConflict: 'tenant_id' });
  }

  const tablesCount = d.features.tableManagement ? d.tableCount : 0;
  if (tablesCount > 0) {
    const tableRows = Array.from({ length: tablesCount }, (_, i) => ({
      tenant_id: d.tenantId,
      outlet_id: outlet.id,
      name: `T-${String(i + 1).padStart(2, '0')}`,
      section: 'Main Dining',
      capacity: 4,
      status: 'vacant',
    }));
    await admin.from('dining_tables').insert(tableRows);
  }

  // Assign tenant owner profile to the new outlet as well
  let ownerProfId = d.ownerProfileId || null;
  if (!ownerProfId) {
    const { data: tm } = await admin.from('tenant_memberships').select('profile_id').eq('tenant_id', d.tenantId).eq('is_owner', true).limit(1).maybeSingle();
    ownerProfId = tm?.profile_id ?? null;
  }
  if (ownerProfId && ownerRole) {
    await admin.from('outlet_memberships').upsert({
      outlet_id: outlet.id,
      profile_id: ownerProfId,
      role_id: ownerRole.id,
      is_primary: false,
      status: 'active',
    }, { onConflict: 'outlet_id,profile_id' });
  }

  await admin.from('audit_logs').insert({
    tenant_id: d.tenantId,
    outlet_id: outlet.id,
    action: 'outlet.created',
    entity_type: 'outlet',
    entity_id: outlet.id,
    new_values: { outletName: d.name, code: cleanCode },
    metadata: { auth_user_id: auth.user.id, reason: 'Platform admin added branch outlet' },
  });

  revalidatePath('/admin');
  return { success: true, outletId: outlet.id };
}

export async function updateOutletConfigAction(
  outletId: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error || 'Unauthorized' };
  if (!z.guid().safeParse(outletId).success) return { success: false, error: 'Invalid outlet ID' };

  const { error } = await auth.supabase.rpc('update_platform_outlet', {
    p_outlet_id: outletId,
    p_payload: payload,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteOutletAction(outletId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error || 'Unauthorized' };
  if (!z.guid().safeParse(outletId).success) return { success: false, error: 'Invalid outlet ID' };

  const { error } = await auth.supabase.rpc('delete_platform_outlet', { p_outlet_id: outletId });
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin');
  return { success: true };
}

export async function seedDemoOrdersAction(outletId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error || 'Unauthorized' };
  if (!z.guid().safeParse(outletId).success) return { success: false, error: 'Invalid outlet ID' };

  const { data, error } = await auth.supabase.rpc('seed_platform_demo_orders', { p_outlet_id: outletId });
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin');
  return { success: true, count: Number(data ?? 5) };
}

export async function switchAdminOutletAction(outletId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.supabase) return { success: false, error: auth.error || 'Unauthorized' };
  if (!z.guid().safeParse(outletId).success) return { success: false, error: 'Invalid outlet ID' };

  const { data, error } = await auth.supabase.rpc('get_pos_session', { p_outlet: outletId });
  if (error || !data) return { success: false, error: 'Outlet is inactive or unavailable.' };

  (await cookies()).set(OUTLET_COOKIE, outletId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  revalidatePath('/admin');
  return { success: true };
}
