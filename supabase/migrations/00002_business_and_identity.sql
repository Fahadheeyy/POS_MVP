-- =========================================================================
-- MIGRATION 00002: Business and Identity Architecture
-- Description: Multi-tenant business entities, Indian state registers, profiles, RBAC and staff security
-- =========================================================================

-- 1. Indian States and GST State Codes
CREATE TABLE IF NOT EXISTS public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(2) UNIQUE NOT NULL, -- e.g. '29' for Karnataka, '27' for Maharashtra, '07' for Delhi
  tin_code CHAR(2) UNIQUE NOT NULL,
  alpha_code CHAR(2) UNIQUE NOT NULL, -- 'KA', 'MH', 'DL'
  name TEXT NOT NULL,
  is_union_territory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Tenants (Restaurant Brands / Franchise Companies)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'QSR', -- 'QSR', 'Dine-In', 'Bakery & Cafe', 'Cloud Kitchen'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding', 'archived')),
  logo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tenant Subscriptions & Entitlements
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_subscription UNIQUE (tenant_id)
);

-- 4. Tenant Feature Overrides
CREATE TABLE IF NOT EXISTS public.tenant_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_override UNIQUE (tenant_id, feature_key)
);

-- 5. Outlets (Individual Store / Branch Locations)
CREATE TABLE IF NOT EXISTS public.outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- e.g. 'IND-01', 'KOR-02'
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'temporarily_closed', 'archived')),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_id UUID REFERENCES public.states(id) ON DELETE RESTRICT,
  pincode VARCHAR(10) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_outlet_code UNIQUE (tenant_id, code)
);

-- 6. Outlet Business Profiles (FSSAI, Receipt Branding & Operational Rules)
CREATE TABLE IF NOT EXISTS public.outlet_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID UNIQUE NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  fssai_number VARCHAR(14),
  fssai_expiry DATE,
  tagline TEXT DEFAULT 'Real Taste • Pure Delight',
  receipt_header TEXT,
  receipt_footer TEXT DEFAULT 'Thank you for dining with us! Visit again.',
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
  service_charge_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  service_charge_enabled BOOLEAN NOT NULL DEFAULT false,
  rounding_strategy TEXT NOT NULL DEFAULT 'round_half_up' CHECK (rounding_strategy IN ('none', 'round_half_up', 'floor', 'ceil')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Outlet GST Registrations
CREATE TABLE IF NOT EXISTS public.outlet_gst_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID UNIQUE NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  gstin VARCHAR(15) NOT NULL,
  trade_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  composition_scheme BOOLEAN NOT NULL DEFAULT false,
  state_code CHAR(2) NOT NULL, -- e.g. '29' (Must match first 2 chars of GSTIN)
  registered_address TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_gstin_format CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
);

-- 8. Profiles (Individual Staff & Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_initials VARCHAR(4) DEFAULT 'SL',
  title TEXT DEFAULT 'Staff Member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Tenant Memberships (Who belongs to which restaurant company)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_membership UNIQUE (tenant_id, profile_id)
);

-- 10. Granular Permissions Catalog
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'pos', 'orders', 'menu', 'kds', 'reports', 'staff', 'settings', 'tax'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Roles (System-wide templates or custom tenant-defined roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for system roles
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_role_code UNIQUE (tenant_id, code)
);

-- 12. Role Permissions (Mapping permissions to roles)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- 13. Outlet Memberships (Assignment of staff to specific branch outlets with a role)
CREATE TABLE IF NOT EXISTS public.outlet_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_member UNIQUE (outlet_id, profile_id)
);

-- 14. User Permission Overrides (Grant or Revoke granular permissions per employee)
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_membership_id UUID NOT NULL REFERENCES public.outlet_memberships(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL, -- true = grant override, false = explicitly revoke override
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_membership_permission_override UNIQUE (outlet_membership_id, permission_id)
);

-- 15. Staff PINs (For fast terminal switching & supervisor overrides; strictly hashed)
CREATE TABLE IF NOT EXISTS public.staff_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL, -- bcrypt/argon2 hash only
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_profile_outlet_pin UNIQUE (profile_id, outlet_id)
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'order.created', 'order.refunded', 'role.changed', 'menu.updated'
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outlets_tenant ON public.outlets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outlet_memberships_profile ON public.outlet_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_outlet_memberships_outlet ON public.outlet_memberships(outlet_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_profile ON public.tenant_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_outlet ON public.audit_logs(tenant_id, outlet_id, created_at DESC);
