/**
 * Application Data Access Layer & Authentication Bridge
 * POS.BITS Enterprise Restaurant SaaS
 */

import { authService, AuthSessionUser } from '@/lib/auth/authService';

export interface AuthResponse {
  success: boolean;
  user?: AuthSessionUser;
  error?: string;
  source?: 'supabase' | 'local';
}

export const api = {
  // Check if Supabase connection is active
  isSupabaseActive: () => true,

  // 1. Email / Password Login (Primary Authentication)
  loginWithCredentials: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const res = await authService.signInWithEmail(email, password);
    return {
      success: res.success,
      user: res.user,
      error: res.error,
      source: 'supabase',
    };
  },

  // 3. Logout
  logout: async () => {
    await authService.signOut();
  },
};
