const API_BASE = '/api';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export const api = {
  // 1. PIN Login
  loginWithPin: async (pin: string, userId?: string, role?: string): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, userId, role }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('pos_jwt_token', data.token);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Cannot connect to authentication server' };
    }
  },

  // 2. Email / Password Login
  loginWithCredentials: async (
    emailOrPhone: string,
    password: string,
    role?: string
  ): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password, role }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('pos_jwt_token', data.token);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Cannot connect to authentication server' };
    }
  },

  // 3. Supervisor PIN Verification
  verifyManagerPin: async (pin: string, actionTitle?: string): Promise<{ success: boolean; supervisor?: any; error?: string }> => {
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
  logout: () => {
    localStorage.removeItem('pos_jwt_token');
  },
};
