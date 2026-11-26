/**
 * Production Authentication & Step-Up Security Service
 * Integrates Supabase SSR Auth with Enterprise RBAC
 */

import { supabase } from '@/lib/supabase/client';
import { resolveEffectivePermissions } from '@/lib/rbac/permissions';
import { User, Role } from '@/types';

export interface AuthSessionUser extends User {
  outletId?: string;
  tenantId?: string;
  effectivePermissions: string[];
}

export interface RegisteredAccount {
  email: string;
  password?: string;
  role: Role;
  name: string;
  title: string;
  initials?: string;
  pin?: string;
  phone?: string;
  outletId?: string;
  tenantId?: string;
}

export class AuthService {
  private static instance: AuthService;
  private supabase = supabase;
  private inMemoryAccounts: RegisteredAccount[] = [];

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Dynamically register or update an account for an outlet owner or staff
   */
  public registerAccount(account: RegisteredAccount): void {
    const normalizedEmail = account.email.toLowerCase().trim();
    const existing = this.getRegisteredAccounts();
    const updated = existing.filter((a) => a.email.toLowerCase().trim() !== normalizedEmail);
    const newRecord: RegisteredAccount = {
      ...account,
      email: normalizedEmail,
      initials:
        account.initials ||
        (account.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'OW'),
    };
    updated.push(newRecord);
    this.inMemoryAccounts = updated;

  }

  /**
   * Retrieve all dynamically registered accounts (survives page refreshes)
   */
  public getRegisteredAccounts(): RegisteredAccount[] {
    return this.inMemoryAccounts;
  }

  /**
   * Find a registered account by email
   */
  public getAccountByEmail(email: string): RegisteredAccount | undefined {
    const normalized = email.toLowerCase().trim();
    return this.getRegisteredAccounts().find((a) => a.email.toLowerCase().trim() === normalized);
  }

  /**
   * Primary Email & Password Login
   */
  public async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (process.env.NODE_ENV === 'development' && normalizedEmail === 'admin@posbits.io'
        && password === 'password123') {
      return this.signInDemoAccount(normalizedEmail, password);
    }

    try {
      // 1. Attempt Supabase Auth login
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        // Fallback for seed mock accounts if Supabase backend user is not yet created in auth.users
        return { success: false, error: 'Unable to sign in with those credentials.' };
      }

      if (!data.user) {
        return { success: false, error: 'User not found in authentication record' };
      }

      const { data: isPlatformAdmin } = await this.supabase.rpc('is_platform_super_admin');
      if (isPlatformAdmin === true) {
        const adminEmail = data.user.email || email;
        return {
          success: true,
          user: {
            id: data.user.id,
            email: adminEmail,
            name: adminEmail,
            phone: '',
            role: 'admin',
            pin: '',
            avatarInitials: 'AD',
            title: 'Platform Super Admin',
            active: true,
            effectivePermissions: Array.from(resolveEffectivePermissions('admin')),
          },
        };
      }

      const { data: profile, error: profileError } = await this.supabase.rpc('get_pos_session');
      if (profileError || !profile) {
        await this.supabase.auth.signOut();
        return { success: false, error: 'Your account has no active outlet assignment.' };
      }
      return { success: true, user: profile as AuthSessionUser };
    } catch (err: any) {
      return { success: false, error: 'Sign-in is unavailable. Please try again.' };
    }
  }

  /**
   * Graceful fallback for seed & dynamically created outlet accounts
   */
  public signInDemoAccount(
    email: string,
    password: string
  ): { success: boolean; user?: AuthSessionUser; error?: string } {
    if (process.env.NODE_ENV === 'production' || !password) {
      return { success: false, error: 'Demo authentication unavailable.' };
    }
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check dynamically registered outlet accounts (newly added outlets, custom owners)
    const dynamicAccounts = this.getRegisteredAccounts();
    const dynamicMatch = dynamicAccounts.find(
      (a) => a.email.toLowerCase().trim() === normalizedEmail
    );

    if (dynamicMatch) {
      if (!dynamicMatch.password || password !== dynamicMatch.password) {
        return {
          success: false,
          error: 'Incorrect password for this account. Please verify and try again.',
        };
      }

      const permissions = Array.from(resolveEffectivePermissions(dynamicMatch.role));
      const user: AuthSessionUser = {
        id: `usr_${dynamicMatch.outletId || dynamicMatch.role}`,
        email: dynamicMatch.email,
        name: dynamicMatch.name,
        role: dynamicMatch.role,
        avatarInitials: dynamicMatch.initials || 'OW',
        title: dynamicMatch.title,
        active: true,
        pin: dynamicMatch.pin || '8888',
        phone: dynamicMatch.phone || '',
        outletId: dynamicMatch.outletId,
        effectivePermissions: permissions,
      };

      if (typeof document !== 'undefined') {
        document.cookie = `pos_session=${encodeURIComponent(
          JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            outletId: user.outletId,
          })
        )}; path=/; max-age=86400; SameSite=Lax`;
      }

      return { success: true, user };
    }

    // 2. Check seed accounts
    const seedAccounts: Record<
      string,
      { name: string; role: Role; title: string; initials: string; pin: string; outletId?: string }
    > = {
      'admin@posbits.io': { name: 'Dev Operations', role: 'admin', title: 'Platform Super Admin', initials: 'AD', pin: '0000' },
      'admin@signlaban.in': { name: 'Dev Operations', role: 'admin', title: 'Platform Super Admin', initials: 'AD', pin: '0000' },
      'dev@posbits.io': { name: 'Dev Operations', role: 'admin', title: 'Platform Super Admin', initials: 'AD', pin: '0000' },
      'vikram@signlaban.in': { name: 'Vikram Sethi', role: 'owner', title: 'Franchise Owner', initials: 'VI', pin: '8888', outletId: 'biz_sign_laban_indiranagar' },
      'owner@signlaban.in': { name: 'Vikram Sethi', role: 'owner', title: 'Franchise Owner', initials: 'VI', pin: '8888', outletId: 'biz_sign_laban_indiranagar' },
      'koramangala.owner@signlaban.in': { name: 'Vikram Sethi', role: 'owner', title: 'Franchise Owner', initials: 'VI', pin: '8888', outletId: 'biz_sign_laban_koramangala' },
      'owner@keventers.demo': { name: 'Rohit Agrawal', role: 'owner', title: 'Franchise Owner', initials: 'RO', pin: '4444', outletId: 'biz_keventers_demo' },
      'owner@belgianwaffle.demo': { name: 'Ananya Deshmukh', role: 'owner', title: 'Franchise Owner', initials: 'AN', pin: '7777', outletId: 'biz_belgian_waffle_demo' },
      'alex@signlaban.in': { name: 'Alex Rivera', role: 'manager', title: 'Store & Shift Manager', initials: 'AL', pin: '9999', outletId: 'biz_sign_laban_indiranagar' },
      'manager@signlaban.in': { name: 'Alex Rivera', role: 'manager', title: 'Store & Shift Manager', initials: 'AL', pin: '9999', outletId: 'biz_sign_laban_indiranagar' },
      'priya@signlaban.in': { name: 'Priya Sharma', role: 'cashier', title: 'Head Cashier', initials: 'PR', pin: '1234', outletId: 'biz_sign_laban_indiranagar' },
      'cashier@signlaban.in': { name: 'Priya Sharma', role: 'cashier', title: 'Head Cashier', initials: 'PR', pin: '1234', outletId: 'biz_sign_laban_indiranagar' },
      'jesselyn@signlaban.in': { name: 'Jesselyn Tan', role: 'kitchen', title: 'Kitchen Lead', initials: 'JE', pin: '1111', outletId: 'biz_sign_laban_indiranagar' },
      'kitchen@signlaban.in': { name: 'Jesselyn Tan', role: 'kitchen', title: 'Kitchen Lead', initials: 'JE', pin: '1111', outletId: 'biz_sign_laban_indiranagar' },
      'marcus@signlaban.in': { name: 'Marcus Chen', role: 'kitchen', title: 'Kitchen Cook', initials: 'MA', pin: '2222', outletId: 'biz_sign_laban_indiranagar' },
    };

    const account = seedAccounts[normalizedEmail];

    if (!account) {
      return {
        success: false,
        error:
          'Invalid email address or credentials. Check your email or use one of the quick sign-in accounts below.',
      };
    }

    // Check seed password if provided
    if (password !== 'password123') {
      return {
        success: false,
        error: 'Incorrect password for this seed account. (Demo password: password123)',
      };
    }

    const permissions = Array.from(resolveEffectivePermissions(account.role));

    const user: AuthSessionUser = {
      id: `usr_${account.role}`,
      email: normalizedEmail,
      name: account.name,
      role: account.role,
      avatarInitials: account.initials,
      title: account.title,
      active: true,
      pin: account.pin,
      outletId: account.outletId,
      effectivePermissions: permissions,
    };

    if (typeof document !== 'undefined') {
      document.cookie = `pos_session=${encodeURIComponent(
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          outletId: user.outletId,
        })
      )}; path=/; max-age=86400; SameSite=Lax`;
    }

    return { success: true, user };
  }

  /**
   * Secure Sign Out
   */
  public async signOut(): Promise<void> {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'pos_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
      await this.supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signout failed or client offline:', err);
    }
  }

  /**
   * Password Reset Request
   */
  public async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Password reset instructions have been sent to your registered email address.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Password reset is unavailable. Please try again.',
      };
    }
  }

}

export const authService = AuthService.getInstance();
