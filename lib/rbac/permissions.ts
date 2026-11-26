/**
 * Granular Role-Based Access Control (RBAC) & Feature Entitlements
 * TIKKIT Enterprise Restaurant SaaS
 */

export const PERMISSION_CODES = {
  // POS & Counter Billing
  POS_ACCESS: 'pos.access',
  
  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  
  // Payments
  PAYMENTS_MANAGE: 'payments.manage',
  
  // Menu & Catalog
  MENU_VIEW: 'menu.view',
  MENU_MANAGE: 'menu.manage',
  
  // Kitchen Display System
  KDS_ACCESS: 'kds.access',
  
  // Reports & Analytics
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Staff & Administration
  STAFF_MANAGE: 'staff.manage',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_MANAGE: 'settings.manage',
  TAX_MANAGE: 'tax.manage',
} as const;

export type PermissionCode = typeof PERMISSION_CODES[keyof typeof PERMISSION_CODES];

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  category: 'pos' | 'orders' | 'menu' | 'kds' | 'reports' | 'staff' | 'settings' | 'tax';
  description: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    code: PERMISSION_CODES.POS_ACCESS,
    name: 'Access POS Terminal',
    category: 'pos',
    description: 'Open counter billing and take orders at checkout',
  },
  {
    code: PERMISSION_CODES.ORDERS_VIEW,
    name: 'View Orders',
    category: 'orders',
    description: 'View active and completed order lists',
  },
  {
    code: PERMISSION_CODES.ORDERS_CREATE,
    name: 'Create Orders',
    category: 'orders',
    description: 'Create new dine-in, takeaway, and delivery orders',
  },
  {
    code: PERMISSION_CODES.ORDERS_CANCEL,
    name: 'Cancel Orders',
    category: 'orders',
    description: 'Cancel unfulfilled orders before food preparation',
  },
  {
    code: PERMISSION_CODES.ORDERS_REFUND,
    name: 'Issue Refunds',
    category: 'orders',
    description: 'Authorize order refunds and generate credit notes',
  },
  {
    code: PERMISSION_CODES.PAYMENTS_MANAGE,
    name: 'Collect Payments',
    category: 'orders',
    description: 'Accept cash, UPI, card payments and close transactions',
  },
  {
    code: PERMISSION_CODES.MENU_VIEW,
    name: 'View Menu & Prices',
    category: 'menu',
    description: 'Browse categories, products, modifiers, and recipe cards',
  },
  {
    code: PERMISSION_CODES.MENU_MANAGE,
    name: 'Manage Menu Catalog',
    category: 'menu',
    description: 'Create, modify prices, toggle out-of-stock items',
  },
  {
    code: PERMISSION_CODES.KDS_ACCESS,
    name: 'Access Kitchen Display',
    category: 'kds',
    description: 'View KDS tickets, bump items, and monitor kitchen rush',
  },
  {
    code: PERMISSION_CODES.REPORTS_VIEW,
    name: 'View Reports & Insights',
    category: 'reports',
    description: 'Inspect sales summaries, shift settlements, and hourly trends',
  },
  {
    code: PERMISSION_CODES.REPORTS_EXPORT,
    name: 'Export Reports',
    category: 'reports',
    description: 'Download CSV and PDF reports for audit and accounting',
  },
  {
    code: PERMISSION_CODES.STAFF_MANAGE,
    name: 'Manage Staff',
    category: 'staff',
    description: 'Invite employees, assign roles, and configure terminal PINs',
  },
  {
    code: PERMISSION_CODES.ROLES_MANAGE,
    name: 'Manage Roles & Permissions',
    category: 'settings',
    description: 'Create custom roles and fine-tune permission overrides',
  },
  {
    code: PERMISSION_CODES.SETTINGS_MANAGE,
    name: 'Manage Store Settings',
    category: 'settings',
    description: 'Configure printers, store info, receipt headers and footers',
  },
  {
    code: PERMISSION_CODES.TAX_MANAGE,
    name: 'Manage GST & Tax',
    category: 'tax',
    description: 'Configure GSTIN, HSN codes, and place-of-supply tax profiles',
  },
];

/**
 * Default permission matrix mapped to built-in system roles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  admin: Object.values(PERMISSION_CODES), // Super Admin / Franchise Group Admin has all
  owner: Object.values(PERMISSION_CODES), // Store / Brand Owner has all
  manager: [
    PERMISSION_CODES.POS_ACCESS,
    PERMISSION_CODES.ORDERS_VIEW,
    PERMISSION_CODES.ORDERS_CREATE,
    PERMISSION_CODES.ORDERS_CANCEL,
    PERMISSION_CODES.ORDERS_REFUND,
    PERMISSION_CODES.PAYMENTS_MANAGE,
    PERMISSION_CODES.MENU_VIEW,
    PERMISSION_CODES.MENU_MANAGE,
    PERMISSION_CODES.KDS_ACCESS,
    PERMISSION_CODES.REPORTS_VIEW,
    PERMISSION_CODES.REPORTS_EXPORT,
    PERMISSION_CODES.STAFF_MANAGE,
    PERMISSION_CODES.SETTINGS_MANAGE,
  ],
  cashier: [
    PERMISSION_CODES.POS_ACCESS,
    PERMISSION_CODES.ORDERS_VIEW,
    PERMISSION_CODES.ORDERS_CREATE,
    PERMISSION_CODES.PAYMENTS_MANAGE,
    PERMISSION_CODES.MENU_VIEW,
  ],
  kitchen: [
    PERMISSION_CODES.KDS_ACCESS,
    PERMISSION_CODES.ORDERS_VIEW,
  ],
};

/**
 * Calculate effective permissions for a user given their role and custom overrides
 */
export function resolveEffectivePermissions(
  roleCode: string,
  overrides?: { permissionCode: string; granted: boolean }[]
): Set<string> {
  const permissions = new Set<string>(DEFAULT_ROLE_PERMISSIONS[roleCode] || []);

  if (overrides && overrides.length > 0) {
    for (const override of overrides) {
      if (override.granted) {
        permissions.add(override.permissionCode);
      } else {
        permissions.delete(override.permissionCode);
      }
    }
  }

  return permissions;
}

/**
 * Check if user has permission
 */
export function hasPermission(
  effectivePermissions: Set<string> | string[],
  requiredPermission: PermissionCode
): boolean {
  if (Array.isArray(effectivePermissions)) {
    return effectivePermissions.includes(requiredPermission);
  }
  return effectivePermissions.has(requiredPermission);
}

/**
 * Check if a subscription plan entitles a given feature
 */
export function isFeatureEntitled(
  planTier: 'starter' | 'growth' | 'enterprise',
  featureKey: string,
  overrides?: Record<string, boolean>
): boolean {
  // Check tenant override first
  if (overrides && typeof overrides[featureKey] === 'boolean') {
    return overrides[featureKey];
  }

  // Plan defaults
  const planEntitlements: Record<string, Record<string, boolean>> = {
    starter: {
      pos: true,
      kds: false,
      reports_advanced: false,
      multi_outlet: false,
      custom_roles: false,
    },
    growth: {
      pos: true,
      kds: true,
      reports_advanced: true,
      multi_outlet: true,
      custom_roles: false,
    },
    enterprise: {
      pos: true,
      kds: true,
      reports_advanced: true,
      multi_outlet: true,
      custom_roles: true,
      analytics_advanced: true,
    },
  };

  return !!planEntitlements[planTier]?.[featureKey];
}
