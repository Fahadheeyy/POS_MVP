import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthSessionUser } from './authService';
import type { PermissionCode } from '@/lib/rbac/permissions';
import type { OutletWorkspace } from '@/services/orderService';

export const OUTLET_COOKIE = 'tikkit_outlet';

export interface OutletAccess extends AuthSessionUser {
  outletId: string;
  tenantId: string;
  stateCode: string;
  outletName: string;
  availableOutlets: Array<{ id: string; name: string }>;
}

export const getOperationalAccess = cache(async (): Promise<OutletAccess | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return null;
  const selected = (await cookies()).get(OUTLET_COOKIE)?.value;
  const [active, choices] = await Promise.all([
    supabase.rpc('get_pos_session', /^[0-9a-f-]{36}$/i.test(selected ?? '') ? { p_outlet: selected } : {}),
    supabase.rpc('get_pos_outlets'),
  ]);
  if (active.error || choices.error) throw new Error('Outlet access could not be loaded.');
  const access = active.data ?? (selected ? (await supabase.rpc('get_pos_session')).data : null);
  return access ? ({ ...access, availableOutlets: choices.data ?? [] } as OutletAccess) : null;
});

export const getInitialOutletWorkspace = cache(
  async (outletId: string, view: 'counter' | 'owner' | 'kitchen' | 'reports'): Promise<OutletWorkspace | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_register_workspace', {
      p_outlet: outletId,
      p_view: view,
    });
    if (error || !data) return null;
    return data as OutletWorkspace;
  }
);

export async function requireOperationalAccess(permission: PermissionCode) {
  const access = await getOperationalAccess();
  if (!access) redirect('/login?error=outlet');
  if (!access.effectivePermissions.includes(permission)) redirect('/access-denied');
  return access;
}

export async function requireOperationalWorkspace(
  permission: PermissionCode,
  view: 'counter' | 'owner' | 'kitchen' | 'reports'
) {
  const access = await requireOperationalAccess(permission);
  const initialWorkspace = await getInitialOutletWorkspace(access.outletId, view);
  return { access, initialWorkspace };
}
