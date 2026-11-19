import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

// Fallback dummy client if credentials not configured yet to avoid runtime crash
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export interface SupabaseUserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'cashier' | 'kitchen' | 'manager' | 'owner' | 'admin';
  title: string;
  avatarInitials: string;
  pin?: string;
  tenantId?: string;
}

// 1. Sign In with Email & Password via Supabase Auth
export async function signInWithSupabaseCredentials(emailOrPhone: string, password: string) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase credentials not configured in .env' };
  }

  try {
    const email = emailOrPhone.includes('@')
      ? emailOrPhone.trim().toLowerCase()
      : `${emailOrPhone.trim()}@signlaban.in`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid credentials' };
    }

    // Attempt to load profile from 'profiles' table if it exists
    let role = data.user.user_metadata?.role || 'cashier';
    let name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Staff';
    let title = data.user.user_metadata?.title || 'Store Staff';
    let avatarInitials = data.user.user_metadata?.avatar_initials || 'SL';

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        role = profile.role || role;
        name = profile.name || name;
        title = profile.title || title;
        avatarInitials = profile.avatar_initials || avatarInitials;
      }
    } catch {}

    const profileObj: SupabaseUserProfile = {
      id: data.user.id,
      name,
      email: data.user.email,
      role,
      title,
      avatarInitials,
    };

    return { success: true, user: profileObj, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase authentication failed' };
  }
}

// 2. Sign In with 4-Digit Staff PIN via Supabase
export async function signInWithSupabasePin(pin: string, targetUserId?: string) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase credentials not configured in .env' };
  }

  try {
    // Query 'profiles' table for matching staff PIN
    let query = supabase.from('profiles').select('*').eq('pin', pin).eq('active', true);
    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }

    const { data: profiles, error } = await query;

    if (error || !profiles || profiles.length === 0) {
      return { success: false, error: 'Invalid PIN' };
    }

    const matched = profiles[0];
    const profileObj: SupabaseUserProfile = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      phone: matched.phone,
      role: matched.role,
      title: matched.title || matched.role,
      avatarInitials: matched.avatar_initials || 'ST',
      pin: matched.pin,
      tenantId: matched.tenant_id,
    };

    return { success: true, user: profileObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to authenticate PIN with Supabase' };
  }
}

// 3. Verify Manager PIN with Supabase
export async function verifySupabaseManagerPin(pin: string) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase credentials not configured in .env' };
  }

  try {
    const { data: supervisors, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('pin', pin)
      .eq('active', true)
      .in('role', ['manager', 'owner', 'admin']);

    if (error || !supervisors || supervisors.length === 0) {
      return { success: false, error: 'Incorrect Manager PIN' };
    }

    return { success: true, supervisor: supervisors[0] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification failed' };
  }
}

// 4. Retrieve Active Supabase Session
export async function getActiveSupabaseSession() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;

    const user = data.session.user;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Staff',
      role: user.user_metadata?.role || 'cashier',
      title: user.user_metadata?.title || 'Staff',
      avatarInitials: user.user_metadata?.avatar_initials || 'ST',
    };
  } catch {
    return null;
  }
}

// 5. Sign Out
export async function signOutSupabase() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch {}
}

