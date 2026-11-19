-- =========================================================================
-- MIGRATION 00006: Seed Production Data & Sign Laban Flagship
-- Description: Indian states, subscription tiers, permission matrix, system roles & initial restaurant data
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

-- 7. Seed Flagship Tenant: Sign Laban
INSERT INTO public.tenants (id, slug, name, legal_name, brand_name, category, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'sign-laban-blr', 'Sign Laban · Indiranagar', 'Sign Laban Foods India Pvt Ltd', 'Sign Laban', 'QSR', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Seed Tenant Subscription
INSERT INTO public.tenant_subscriptions (tenant_id, plan_id, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'active')
ON CONFLICT (tenant_id) DO NOTHING;

-- Seed Primary Outlet
INSERT INTO public.outlets (id, tenant_id, name, code, is_default, address_line1, city, state_id, pincode, phone, email) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Sign Laban Indiranagar Flagship',
    'IND-01',
    true,
    '12th Main Rd, HAL 2nd Stage, Indiranagar',
    'Bengaluru',
    (SELECT id FROM public.states WHERE code = '29' LIMIT 1),
    '560038',
    '+91 80 4123 4567',
    'indiranagar@signlaban.in'
  )
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Seed Outlet Business Profile
INSERT INTO public.outlet_business_profiles (outlet_id, fssai_number, fssai_expiry, tagline, receipt_header, receipt_footer, service_charge_percent, service_charge_enabled) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '11223334000123',
    '2028-12-31',
    'Real Taste • Pure Delight',
    'Sign Laban QSR Flagship - 12th Main Indiranagar',
    'Thank you for dining with Sign Laban! Follow us @signlaban',
    0.00,
    false
  )
ON CONFLICT (outlet_id) DO NOTHING;

-- Seed Outlet GST Registration (Karnataka State Code 29)
INSERT INTO public.outlet_gst_registrations (outlet_id, gstin, trade_name, legal_name, composition_scheme, state_code, registered_address) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '29AABCS1429B1Z8',
    'Sign Laban Indiranagar',
    'Sign Laban Foods India Pvt Ltd',
    false,
    '29',
    '12th Main Rd, Indiranagar, Bengaluru, KA 560038'
  )
ON CONFLICT (outlet_id) DO NOTHING;

-- Seed Standard Restaurant Tax Profile (5% GST: 2.5% CGST + 2.5% SGST)
INSERT INTO public.tax_profiles (id, tenant_id, name, is_composition_scheme, is_active) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Restaurant 5% GST', false, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tax_components (tax_profile_id, name, rate_percent, is_intra_state_only) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'CGST', 2.50, true),
  ('e0000000-0000-0000-0000-000000000001', 'SGST', 2.50, true)
ON CONFLICT DO NOTHING;

-- Seed Dining Tables
INSERT INTO public.dining_tables (tenant_id, outlet_id, name, section, capacity, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-01', 'Indoor Dine-In', 2, 'vacant'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-02', 'Indoor Dine-In', 4, 'vacant'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-03', 'Indoor Dine-In', 4, 'vacant'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-04', 'Indoor Dine-In', 6, 'vacant'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Counter-01', 'Takeaway Express', 1, 'vacant')
ON CONFLICT (outlet_id, name) DO NOTHING;

-- Seed Staff Profiles (Initial Seed)
INSERT INTO public.profiles (id, email, name, phone, avatar_initials, title) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'priya@signlaban.in', 'Priya Sharma', '+91 98765 43211', 'PR', 'Head Cashier'),
  ('f0000000-0000-0000-0000-000000000002', 'jesselyn@signlaban.in', 'Jesselyn Tan', '+91 98765 43210', 'JE', 'Kitchen Lead'),
  ('f0000000-0000-0000-0000-000000000003', 'marcus@signlaban.in', 'Marcus Chen', '+91 98765 43212', 'MA', 'Kitchen Cook'),
  ('f0000000-0000-0000-0000-000000000004', 'alex@signlaban.in', 'Alex Rivera', '+91 98765 43213', 'AL', 'Store & Shift Manager'),
  ('f0000000-0000-0000-0000-000000000005', 'vikram@signlaban.in', 'Vikram Sethi', '+91 98765 43214', 'VI', 'Franchise Owner'),
  ('f0000000-0000-0000-0000-000000000006', 'admin@posbits.io', 'Dev Operations', '+91 99000 00000', 'AD', 'Platform Super Admin')
ON CONFLICT (email) DO NOTHING;

-- Map Staff to Tenant Memberships
INSERT INTO public.tenant_memberships (tenant_id, profile_id, is_owner) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', true),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', false),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', false),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', false),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', false)
ON CONFLICT (tenant_id, profile_id) DO NOTHING;

-- Map Staff to Outlet Memberships with Roles
INSERT INTO public.outlet_memberships (outlet_id, profile_id, role_id, is_primary) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', true), -- Vikram -> Owner
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', true), -- Alex -> Manager
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', true), -- Priya -> Cashier
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', true), -- Jesselyn -> Kitchen
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', true)  -- Marcus -> Kitchen
ON CONFLICT (outlet_id, profile_id) DO NOTHING;

-- Seed Fast Terminal PIN Hashes (BCrypt of '1234', '1111', '2222', '9999', '8888')
INSERT INTO public.staff_pins (profile_id, outlet_id, pin_hash) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', crypt('1234', gen_salt('bf'))),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', crypt('1111', gen_salt('bf'))),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', crypt('2222', gen_salt('bf'))),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', crypt('9999', gen_salt('bf'))),
  ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', crypt('8888', gen_salt('bf')))
ON CONFLICT (profile_id, outlet_id) DO NOTHING;
