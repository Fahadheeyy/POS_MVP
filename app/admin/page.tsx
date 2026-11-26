import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createTenant, signOutPlatformAdmin, updateTenantStatus } from './actions';

const statuses = ['onboarding', 'active', 'suspended', 'archived'] as const;
const inputClass = 'rounded border border-slate-300 p-2';
const buttonClass = 'tikkit-button tikkit-button-primary';

export default async function AdminRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: allowed, error: authorizationError } = await supabase.rpc('is_platform_super_admin');
  if (authorizationError) return <main className="p-8">Platform authorization is unavailable.</main>;
  if (!allowed) redirect('/access-denied');

  const [{ error }, tenants, audit] = await Promise.all([
    searchParams,
    supabase.from('tenants').select('id, name, slug, status').order('name'),
    supabase.from('audit_logs').select('id, action, entity_id, old_values, new_values, metadata, created_at')
      .in('action', ['tenant.created', 'tenant.status_changed'])
      .order('created_at', { ascending: false }).limit(25),
  ]);

  const saveError = error === 'duplicate' ? 'This tenant slug is already in use.'
    : error === 'invalid' ? 'Check the form fields and try again.'
    : error === 'save' ? 'The tenant change could not be saved.' : null;

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-8 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Platform administration</h1>
        <form action={signOutPlatformAdmin}>
          <button className="rounded border px-4 py-2">Sign out</button>
        </form>
      </header>
      {saveError && <p role="alert" className="text-red-700">{saveError}</p>}
      <section className="grid gap-4 tikkit-card p-5">
        <h2 className="text-lg font-semibold">Create tenant</h2>
        <form action={createTenant} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">Name<input name="name" maxLength={120} required className={inputClass} /></label>
          <label className="grid gap-1">Slug<input name="slug" maxLength={80} pattern="[a-z0-9]+(\x2d[a-z0-9]+)*" required className={inputClass} /></label>
          <label className="grid gap-1 sm:col-span-2">Reason<input name="reason" maxLength={500} required className={inputClass} /></label>
          <button className={buttonClass}>Create tenant</button>
        </form>
      </section>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Tenants</h2>
        {tenants.error && <p role="alert">Tenant records are unavailable.</p>}
        {tenants.data?.length === 0 && <p>No tenants yet.</p>}
        {tenants.data?.map((tenant) => (
          <article key={tenant.id} className="grid gap-3 tikkit-card p-5">
            <h3 className="font-semibold"><Link className="underline" href={`/admin/tenants/${tenant.id}`}>{tenant.name}</Link></h3>
            <p className="text-sm text-slate-600">{tenant.slug} · {tenant.status}</p>
            <form action={updateTenantStatus} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <label className="grid gap-1">Status<select name="status" defaultValue={tenant.status} className={inputClass}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select></label>
              <label className="grid flex-1 gap-1">Reason<input name="reason" maxLength={500} required className={inputClass} /></label>
              <button className={buttonClass}>Save status</button>
            </form>
          </article>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Recent tenant changes</h2>
        {audit.error && <p role="alert">Audit records are unavailable.</p>}
        {audit.data?.length === 0 && <p>No recorded changes yet.</p>}
        <ul className="grid gap-2">
          {audit.data?.map((entry) => (
            <li key={entry.id} className="rounded border p-3 text-sm">
              <strong>{entry.action === 'tenant.created' ? 'Tenant created' : 'Status changed'}</strong>
              {' · '}{tenants.data?.find((tenant) => tenant.id === entry.entity_id)?.name ?? entry.entity_id}
              {' · '}{entry.new_values?.status}
              <p>{entry.metadata?.reason}</p>
              <p className="text-slate-600">{new Date(entry.created_at).toISOString()} · {entry.metadata?.auth_user_id}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
