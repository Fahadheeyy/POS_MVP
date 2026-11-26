import { StaffInvitation } from '@/components/StaffInvitation';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { configureTenant } from './actions';

const inputClass = 'rounded border border-slate-300 p-2';
const sectionClass = 'grid gap-4 tikkit-card p-5';
const buttonClass = 'w-fit tikkit-button tikkit-button-primary';

function Reason() {
  return (
    <label className="grid gap-1">
      Reason for change
      <input name="reason" maxLength={500} required className={inputClass} />
    </label>
  );
}

export default async function TenantWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: allowed, error: authError } = await supabase.rpc('is_platform_super_admin');
  if (authError) throw new Error('Platform authorization is unavailable.');
  if (!allowed) redirect('/access-denied');

  const { tenantId } = await params;
  if (!z.guid().safeParse(tenantId).success) notFound();

  const [tenant, outlets, subscription, overrides, plans, features, states, audit, feedback] = await Promise.all([
    supabase.from('tenants').select('name, slug, status').eq('id', tenantId).maybeSingle(),
    supabase.from('outlets').select('id, name, code, city, status, outlet_business_profiles(fssai_number)')
      .eq('tenant_id', tenantId).order('name')
      .overrideTypes<Array<{
        id: string;
        name: string;
        code: string;
        city: string;
        status: string;
        outlet_business_profiles: { fssai_number: string | null } | null;
      }>, { merge: false }>(),
    supabase.from('tenant_subscriptions').select('plan_id, status').eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('tenant_feature_overrides').select('feature_key, is_enabled').eq('tenant_id', tenantId),
    supabase.from('subscription_plans').select('id, code, name, is_active').order('display_order'),
    supabase.from('plan_features').select('feature_key, plan_id, is_enabled'),
    supabase.from('states').select('code, name').eq('is_active', true).order('name'),
    supabase.from('audit_logs').select('id, action, created_at, metadata').eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }).limit(25),
    searchParams,
  ]);
  if ([tenant, outlets, subscription, overrides, plans, features, states, audit].some((result) => result.error)) {
    throw new Error('Tenant configuration is unavailable.');
  }
  if (!tenant.data) notFound();

  const save = configureTenant.bind(null, tenantId);
  const editable = tenant.data.status !== 'archived';
  const activePlans = plans.data?.filter((plan) => plan.is_active) ?? [];
  const currentPlan = plans.data?.find((plan) => plan.id === subscription.data?.plan_id);
  const keys = [...new Set(features.data?.map((feature) => feature.feature_key))].sort();
  const message = feedback.error === 'duplicate' ? 'This outlet code is already in use.'
    : feedback.error === 'invalid' ? 'Check the form fields and try again.'
    : feedback.error ? 'The configuration change could not be saved.' : null;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-8 text-slate-900">
      <header>
        <Link href="/admin" className="text-sm underline">Platform administration</Link>
        <h1 className="mt-2 text-2xl font-semibold">{tenant.data.name}</h1>
        <p>{tenant.data.slug} · {tenant.data.status}</p>
      </header>
      {message && <p role="alert" className="text-red-700">{message}</p>}
      {feedback.saved && <p role="status" className="text-green-800">Configuration saved.</p>}
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Outlets</h2>
        {outlets.data?.length === 0 && <p>No outlets yet.</p>}
        {outlets.data?.map((outlet) => (
          <article key={outlet.id} className="grid gap-2 border-b pb-4">
            <h3 className="font-medium">{outlet.name}</h3>
            <p>{outlet.code} · {outlet.city} · {outlet.status}</p>
            <p>FSSAI {outlet.outlet_business_profiles?.fssai_number ?? 'not configured'}</p>
            {editable && (
              <form action={save} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="operation" value="outlet.status_changed" />
                <input type="hidden" name="outletId" value={outlet.id} />
                <label className="grid gap-1">Outlet status
                  <select name="status" defaultValue={outlet.status} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="temporarily_closed">Temporarily closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <Reason />
                <button className={buttonClass}>Save outlet status</button>
              </form>
            )}
            {editable && <StaffInvitation outlet={outlet.id} owner/>}
          </article>
        ))}
        {editable && (
          <form action={save} className="grid gap-3 sm:grid-cols-2">
            <h3 className="font-medium sm:col-span-2">Add outlet</h3>
            <input type="hidden" name="operation" value="outlet.created" />
            <label className="grid gap-1">Outlet name<input name="name" maxLength={120} required className={inputClass} /></label>
            <label className="grid gap-1">Outlet code<input name="code" maxLength={24} required className={inputClass} /></label>
            <label className="grid gap-1">Address<input name="address" maxLength={240} required className={inputClass} /></label>
            <label className="grid gap-1">City<input name="city" maxLength={120} required className={inputClass} /></label>
            <label className="grid gap-1">State<select name="state" required defaultValue="" className={inputClass}>
              <option value="" disabled>Select state</option>
              {states.data?.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </select></label>
            <label className="grid gap-1">PIN code<input name="pincode" inputMode="numeric" maxLength={6} required className={inputClass} /></label>
            <label className="grid gap-1">Phone<input name="phone" type="tel" required className={inputClass} /></label>
            <label className="grid gap-1">Email<input name="email" type="email" required className={inputClass} /></label>
            <label className="grid gap-1">14-digit FSSAI number<input name="fssai" inputMode="numeric" maxLength={14} required className={inputClass} /></label>
            <Reason />
            <button className={buttonClass}>Create outlet</button>
          </form>
        )}
      </section>
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Subscription plan</h2>
        <p>{currentPlan?.name ?? 'No plan assigned'}{subscription.data && ` · ${subscription.data.status}`}</p>
        {editable && activePlans.length > 0 && (
          <form action={save} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="operation" value="subscription.plan_changed" />
            <label className="grid gap-1">Plan<select name="plan" defaultValue={currentPlan?.is_active ? currentPlan.code : ''} required className={inputClass}>
              <option value="" disabled>Select plan</option>
              {activePlans.map((plan) => <option key={plan.id} value={plan.code}>{plan.name}</option>)}
            </select></label>
            <Reason />
            <button className={buttonClass}>Assign plan</button>
          </form>
        )}
      </section>
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Feature overrides</h2>
        {keys.length === 0 && <p>No plan features configured.</p>}
        {keys.map((key) => {
          const override = overrides.data?.find((item) => item.feature_key === key);
          const inherited = features.data?.some((item) => item.feature_key === key && item.plan_id === currentPlan?.id && item.is_enabled);
          const mode = override ? (override.is_enabled ? 'enabled' : 'disabled') : 'inherit';
          return (
            <article key={key} className="grid gap-2 border-b pb-4">
              <h3 className="font-medium">{key.replaceAll('_', ' ')}</h3>
              <p>{(override?.is_enabled ?? inherited) ? 'Enabled' : 'Disabled'} · {override ? 'Override' : 'Plan default'}</p>
              {editable && <form action={save} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="operation" value="feature.override_changed" />
                <input type="hidden" name="feature" value={key} />
                <label className="grid gap-1">Access<select name="mode" defaultValue={mode} className={inputClass}>
                  <option value="inherit">Use plan default</option>
                  <option value="enabled">Enable</option>
                  <option value="disabled">Disable</option>
                </select></label>
                <Reason />
                <button className={buttonClass}>Save override</button>
              </form>}
            </article>
          );
        })}
      </section>
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {audit.data?.length === 0 && <p>No changes recorded.</p>}
        <ul className="grid gap-2">
          {audit.data?.map((entry) => (
            <li key={entry.id} className="border-b pb-2">
              <strong>{entry.action}</strong><p>{entry.metadata?.reason}</p>
              <p className="text-sm text-slate-600">{new Date(entry.created_at).toISOString()} · {entry.metadata?.auth_user_id}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
