import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOperationalAccess } from '@/lib/auth/operationalAccess';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: admin } = await supabase.rpc('is_platform_super_admin');
  if (admin === true) redirect('/admin');
  const access = await getOperationalAccess();
  if (!access) redirect('/login?error=outlet');
  const permissions = access.effectivePermissions;
  if (access.role === 'manager' && permissions.includes('staff.manage')) redirect('/manager');
  if (access.role === 'owner' && permissions.includes('reports.view')) redirect('/owner');
  if (permissions.includes('pos.access')) redirect('/pos');
  if (permissions.includes('kds.access')) redirect('/kds');
  if (permissions.includes('orders.view')) redirect('/orders');
  if (permissions.includes('reports.view')) redirect('/owner');
  if (permissions.includes('staff.manage')) redirect('/manager');
  if (permissions.includes('settings.manage')) redirect('/settings');
  redirect('/login?error=outlet');
}
