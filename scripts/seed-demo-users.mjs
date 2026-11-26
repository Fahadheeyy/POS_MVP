import { createClient } from '@supabase/supabase-js';

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321');
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) {
  throw new Error('Demo accounts require a local Supabase URL.');
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY from your local Supabase instance.');

const supabase = createClient(url.origin, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const password = 'TikkitDemo2026!';
const accounts = ['cashier', 'kitchen', 'kitchen2', 'manager', 'owner', 'admin'];

for (const [index, role] of accounts.entries()) {
  const email = `${role}@tikkit.test`;
  const profileId = `f0000000-0000-0000-0000-00000000000${index + 1}`;
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('auth_user_id, name').eq('id', profileId).single();
  if (profileError) throw profileError;

  let user;
  if (profile.auth_user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(profile.auth_user_id);
    if (error) throw error;
    user = data.user;
    if (user.email !== email || user.app_metadata.tikkit_demo !== true) {
      throw new Error(`The ${role} seed profile is already linked to another account.`);
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { tikkit_demo: true },
    });
    if (error) throw error;
    user = data.user;
    const { data: linked, error: linkError } = await supabase.from('profiles')
      .update({ auth_user_id: user.id, email }).eq('id', profileId).is('auth_user_id', null).select('id').single();
    if (linkError || !linked) {
      await supabase.auth.admin.deleteUser(user.id);
      throw linkError ?? new Error(`Could not link the ${role} seed profile.`);
    }
  }

  if (role === 'admin') {
    const { error } = await supabase.from('platform_admins').upsert({
      user_id: user.id, email, name: profile.name, is_super_admin: true, status: 'active',
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  console.log(`${role}: ${email}`);
}
