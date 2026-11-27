import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OUTLET_COOKIE } from '@/lib/auth/operationalAccess';
import { AdminPortalPage, type AdminWorkspaceBusiness } from '@/features/admin/AdminPortalPage';

export default async function AdminRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: allowed, error: authorizationError } = await supabase.rpc('is_platform_super_admin');
  if (authorizationError) {
    return <main className="p-8">Platform authorization is unavailable.</main>;
  }
  if (!allowed) redirect('/access-denied');

  const { data: workspace, error: wsError } = await supabase.rpc('get_platform_admin_workspace');
  if (wsError || !workspace) {
    return (
      <main className="p-8 text-slate-900">
        Platform workspace could not be loaded: {wsError?.message || 'Unknown error'}
      </main>
    );
  }

  const cookieStore = await cookies();
  const selectedCookie = cookieStore.get(OUTLET_COOKIE)?.value;
  const businesses = (workspace.businesses || []) as AdminWorkspaceBusiness[];
  const validActive =
    businesses.find((b) => b.id === selectedCookie)?.id || businesses[0]?.id || '';

  return (
    <AdminPortalPage
      mode="supabase"
      initialBusinesses={businesses}
      initialStats={workspace.stats}
      initialActiveOutletId={validActive}
      states={workspace.states}
      adminUser={{
        id: user.id,
        name: 'Dev Operations',
        email: user.email || 'admin@tikkit.test',
        avatarInitials: 'AD',
        title: 'Platform Super Admin',
      }}
    />
  );
}
