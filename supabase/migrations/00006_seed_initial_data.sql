-- =========================================================================
-- MIGRATION 00006: Seed platform reference data
-- Description: Indian states, subscription tiers, permission matrix, and system roles
-- =========================================================================

-- 1. Seed Key Indian States (GST State Codes)
INSERT INTO public.states (code, tin_code, alpha_code, name, is_union_territory) VALUES
  ('29', '29', 'KA', 'Karnataka', false),
  ('27', '27', 'MH', 'Maharashtra', false),
  ('07', '07', 'DL', 'Delhi', true),
  ('33', '33', 'TN', 'Tamil Nadu', false),
  ('36', '36', 'TS', 'Telangana', false),
  ('06', '06', 'HR', 'Haryana', false),
  ('09', '09', 'UP', 'Uttar Pradesh', false),
  ('19', '19', 'WB', 'West Bengal', false),
  ('24', '24', 'GJ', 'Gujarat', false),
  ('32', '32', 'KL', 'Kerala', false),
  ('03', '03', 'PB', 'Punjab', false),
  ('08', '08', 'RJ', 'Rajasthan', false),
  ('23', '23', 'MP', 'Madhya Pradesh', false),
  ('21', '21', 'OR', 'Odisha', false),
  ('10', '10', 'BR', 'Bihar', false),
  ('20', '20', 'JH', 'Jharkhand', false),
  ('22', '22', 'CG', 'Chhattisgarh', false),
  ('02', '02', 'HP', 'Himachal Pradesh', false),
  ('05', '05', 'UK', 'Uttarakhand', false),
  ('30', '30', 'GA', 'Goa', false),
  ('01', '01', 'JK', 'Jammu & Kashmir', true),
  ('04', '04', 'CH', 'Chandigarh', true),
  ('37', '37', 'AP', 'Andhra Pradesh', false),
  ('34', '34', 'PY', 'Puducherry', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Subscription Plans
INSERT INTO public.subscription_plans (id, code, name, description, price_monthly, price_annually, max_outlets, max_users, display_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'starter', 'Starter QSR', 'Single outlet essentials for growing food stalls and quick counters', 1499.00, 14990.00, 1, 4, 1),
  ('c0000000-0000-0000-0000-000000000002', 'growth', 'Growth Multi-Branch', 'Comprehensive operations with KDS, reports and multi-terminal sync', 3499.00, 34990.00, 3, 15, 2),
  ('c0000000-0000-0000-0000-000000000003', 'enterprise', 'Enterprise Chains', 'Full chain management, custom roles, API access and franchise governance', 7999.00, 79990.00, 100, 200, 3)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Plan Features
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled, limit_value) VALUES
  -- Starter
  ('c0000000-0000-0000-0000-000000000001', 'pos', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000001', 'kds', false, 'disabled'),
  ('c0000000-0000-0000-0000-000000000001', 'reports_advanced', false, 'disabled'),
  ('c0000000-0000-0000-0000-000000000001', 'multi_outlet', false, '1'),
  -- Growth
  ('c0000000-0000-0000-0000-000000000002', 'pos', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000002', 'kds', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000002', 'reports_advanced', true, 'advanced'),
  ('c0000000-0000-0000-0000-000000000002', 'multi_outlet', true, '3'),
  -- Enterprise
  ('c0000000-0000-0000-0000-000000000003', 'pos', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000003', 'kds', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000003', 'reports_advanced', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000003', 'multi_outlet', true, 'unlimited'),
  ('c0000000-0000-0000-0000-000000000003', 'analytics_advanced', true, 'unlimited')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 4. Seed Permissions Catalog
INSERT INTO public.permissions (code, name, category, description) VALUES
  ('pos.access', 'Access POS Terminal', 'pos', 'Open and use cashier order screen'),
  ('orders.view', 'View Orders', 'orders', 'View active and completed orders list'),
  ('orders.create', 'Create Orders', 'orders', 'Punch new orders for dine-in, takeaway, or delivery'),
  ('orders.cancel', 'Cancel Orders', 'orders', 'Cancel active orders before preparation or billing'),
  ('orders.refund', 'Refund Orders', 'orders', 'Authorize order refund and generate credit note'),
  ('payments.manage', 'Collect Payments', 'payments', 'Accept cash, UPI, card payments and close bill'),
  ('menu.view', 'View Menu & Prices', 'menu', 'Inspect menu categories, items and modifiers'),
  ('menu.manage', 'Manage Menu Catalog', 'menu', 'Add, update or toggle availability of menu items'),
  ('kds.access', 'Access Kitchen Display', 'kds', 'View and bump kitchen orders and items'),
  ('reports.view', 'View Reports', 'reports', 'View sales, payment breakdown and day-end summaries'),
  ('reports.export', 'Export Reports', 'reports', 'Download CSV/PDF audit and tax summaries'),
  ('staff.manage', 'Manage Staff & PINs', 'staff', 'Invite staff, assign roles and configure PINs'),
  ('roles.manage', 'Manage Custom Roles', 'roles', 'Create custom roles and fine-tune permissions'),
  ('settings.manage', 'Manage Store Settings', 'settings', 'Configure store info, printers, receipt templates'),
  ('tax.manage', 'Manage Tax & GST', 'tax', 'Configure GSTIN, HSN rates and tax profiles')
ON CONFLICT (code) DO NOTHING;

-- 5. Seed System Roles
INSERT INTO public.roles (id, tenant_id, code, name, description, is_system) VALUES
  ('d0000000-0000-0000-0000-000000000001', NULL, 'owner', 'Franchise Owner', 'Complete control over restaurant group, billing and analytics', true),
  ('d0000000-0000-0000-0000-000000000002', NULL, 'manager', 'Store Manager', 'Supervises store operations, cashier shifts, menu edits and cancellations', true),
  ('d0000000-0000-0000-0000-000000000003', NULL, 'cashier', 'Head Cashier', 'Handles counter billing, punch orders and collect customer payments', true),
  ('d0000000-0000-0000-0000-000000000004', NULL, 'kitchen', 'Kitchen Lead / Cook', 'Operates kitchen display screen, bumps tickets and tracks prep times', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed System Role Permissions
-- Owner has all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000001', p.id FROM public.permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager has operational and supervision permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000002', p.id FROM public.permissions p
WHERE p.code IN (
  'pos.access', 'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',
  'payments.manage', 'menu.view', 'menu.manage', 'kds.access', 'reports.view',
  'reports.export', 'staff.manage', 'settings.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier has front-desk billing permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000003', p.id FROM public.permissions p
WHERE p.code IN ('pos.access', 'orders.view', 'orders.create', 'payments.manage', 'menu.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Kitchen staff has KDS access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000004', p.id FROM public.permissions p
WHERE p.code IN ('kds.access', 'orders.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;
