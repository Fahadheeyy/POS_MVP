import {
  isSupabaseConfigured,
  signInWithSupabaseCredentials,
  signInWithSupabasePin,
  verifySupabaseManagerPin,
  getActiveSupabaseSession,
  signOutSupabase,
} from '../lib/supabase';

const API_BASE = '/api';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
  source?: 'supabase' | 'server' | 'local';
}

export const api = {
  // Check if Supabase is connected
  isSupabaseActive: () => isSupabaseConfigured,

  // 1. PIN Login
  loginWithPin: async (pin: string, userId?: string, role?: string): Promise<AuthResponse> => {
    // Priority 1: Supabase Authentication
    if (isSupabaseConfigured) {
      const res = await signInWithSupabasePin(pin, userId);
      if (res.success && res.user) {
        return { success: true, user: res.user, source: 'supabase' };
      }
      if (res.error && res.error !== 'Supabase credentials not configured in .env') {
        return { success: false, error: res.error, source: 'supabase' };
      }
    }

    // Priority 2: Express Backend Server
    try {
      const res = await fetch(`${API_BASE}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, userId, role }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('pos_jwt_token', data.token);
        return { ...data, source: 'server' };
      }
      return data;
    } catch {
      // Local fallback in case server is not running
      return { success: false, error: 'Connecting to auth service...' };
    }
  },

  // 2. Email / Password Login
  loginWithCredentials: async (
    emailOrPhone: string,
    password: string,
    role?: string
  ): Promise<AuthResponse> => {
    // Priority 1: Supabase Auth
    if (isSupabaseConfigured) {
      const res = await signInWithSupabaseCredentials(emailOrPhone, password);
      if (res.success && res.user) {
        return { success: true, user: res.user, source: 'supabase' };
      }
      if (res.error && res.error !== 'Supabase credentials not configured in .env') {
        return { success: false, error: res.error, source: 'supabase' };
      }
    }

    // Priority 2: Express Backend Server
    try {
      const res = await fetch(`${API_BASE}/auth/login-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password, role }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('pos_jwt_token', data.token);
        return { ...data, source: 'server' };
      }
      return data;
    } catch {
      return { success: false, error: 'Connecting to auth service...' };
    }
  },

  // 3. Supervisor PIN Verification
  verifyManagerPin: async (pin: string, actionTitle?: string): Promise<{ success: boolean; supervisor?: any; error?: string }> => {
    // Priority 1: Supabase
    if (isSupabaseConfigured) {
      const res = await verifySupabaseManagerPin(pin);
      if (res.success) return res;
    }

    // Priority 2: Express Backend Server
    try {
      const res = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, actionTitle }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  },

  // 4. Session Validation
  getCurrentSession: async (): Promise<any | null> => {
    // Priority 1: Supabase
    if (isSupabaseConfigured) {
      const user = await getActiveSupabaseSession();
      if (user) return user;
    }

    // Priority 2: Express / JWT
    const token = localStorage.getItem('pos_jwt_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.success ? data.user : null;
    } catch {
      return null;
    }
  },

  // 5. Logout
  logout: async () => {
    await signOutSupabase();
    localStorage.removeItem('pos_jwt_token');
  },
};
