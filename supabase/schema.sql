-- =========================================================================
-- MIGRATION 00001: Extensions and Platform Core
-- Description: Enables core extensions and platform-level administration tables
-- =========================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'starter', 'growth', 'enterprise'
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_annually NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_outlets INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Plan Features
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- e.g. 'pos', 'kds', 'reports_advanced', 'multi_outlet', 'analytics_advanced'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  limit_value TEXT, -- e.g. 'unlimited', '10', 'basic'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_key)
);

-- 4. Platform Admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL, -- links to auth.users.id
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON public.plan_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON public.platform_admins(user_id);
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
-- =========================================================================
-- MIGRATION 00003: Restaurant Operations and Menu Architecture
-- Description: Categories, products, modifiers, tables, orders, items, payments & KDS tickets
-- =========================================================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE, -- NULL means available across all outlets of tenant
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tenant_category_slug UNIQUE (tenant_id, outlet_id, slug)
);

-- 2. Products / Menu Items
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  cost_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (cost_price >= 0),
  hsn_sac_code VARCHAR(10) NOT NULL DEFAULT '996331', -- SAC 996331: Restaurant and food service
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sku VARCHAR(50),
  barcode VARCHAR(50),
  image_url TEXT,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Modifier Groups (e.g. "Size", "Toppings", "Milk Option")
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_selection INTEGER NOT NULL DEFAULT 0,
  max_selection INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Modifier Options (e.g. "Regular (+₹0)", "Large (+₹40)", "Extra Boba (+₹30)")
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price_delta >= 0),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Product - Modifier Group Associations
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_modifier_group UNIQUE (product_id, group_id)
);

-- 6. Dining Tables
CREATE TABLE IF NOT EXISTS public.dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "T-01", "Counter-01"
  section TEXT NOT NULL DEFAULT 'Main Dining',
  capacity INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'billed', 'reserved')),
  active_order_id UUID, -- Forward reference to orders
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_table_name UNIQUE (outlet_id, name)
);

-- 7. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL, -- e.g. '#0142' or daily sequential token
  order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  table_id UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')),
  customer_name TEXT DEFAULT 'Guest',
  customer_phone TEXT,
  customer_gstin VARCHAR(15), -- Optional B2B invoice customer GSTIN
  item_count INTEGER NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  service_charge_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rounding_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready', 'served', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Order Item Modifiers (Snapshot of selected modifiers)
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES public.modifier_options(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'split', 'credit')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  reference_number TEXT, -- UPI UTR number, EDC terminal reference, or card auth code
  collected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. KDS Kitchen Display Tickets
CREATE TABLE IF NOT EXISTS public.kds_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. KDS Ticket Items
CREATE TABLE IF NOT EXISTS public.kds_ticket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.kds_tickets(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready', 'delivered')),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_outlet ON public.products(tenant_id, outlet_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_status ON public.orders(outlet_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_tickets_outlet_status ON public.kds_tickets(outlet_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
-- =========================================================================
-- MIGRATION 00004: Tax and Billing Architecture (Indian GST Rule 46 Compliance)
-- Description: Tax profiles, GST components, atomic invoice sequence generation, tax invoices & credit notes
-- =========================================================================

-- 1. Tax Profiles
CREATE TABLE IF NOT EXISTS public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'GST 5% Restaurant (Standard)',
  is_composition_scheme BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tax Components (CGST, SGST, IGST)
CREATE TABLE IF NOT EXISTS public.tax_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('CGST', 'SGST', 'IGST')),
  rate_percent NUMERIC(5, 2) NOT NULL CHECK (rate_percent >= 0),
  is_intra_state_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Invoice Sequences (Guarantees unique, consecutive invoice numbers per financial year)
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  financial_year VARCHAR(10) NOT NULL, -- e.g. '2026-27'
  prefix VARCHAR(20) NOT NULL, -- e.g. 'INV-SLI-26/'
  next_number BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_sequence_fy UNIQUE (outlet_id, financial_year)
);

-- 4. Invoices (Immutable GST Rule 46 Compliant Invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(16) NOT NULL, -- Strictly <= 16 characters per GST Rule 46(b)
  financial_year VARCHAR(10) NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  place_of_supply_state_code CHAR(2) NOT NULL, -- State code per IGST Act Sec 12(4)
  customer_gstin VARCHAR(15), -- Present if B2B
  customer_name TEXT DEFAULT 'Guest',
  customer_address TEXT,
  b2b_b2c_type VARCHAR(20) NOT NULL DEFAULT 'B2C_SMALL' CHECK (b2b_b2c_type IN ('B2C_SMALL', 'B2C_LARGE', 'B2B')),
  
  -- Tax Breakdown (Financial precision: NUMERIC(10,2))
  taxable_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
  cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
  sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  service_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rounding_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Complete frozen copy of order items and taxes at moment of billing
  immutable_payload_snapshot JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_invoice_number UNIQUE (outlet_id, invoice_number)
);

-- 5. Credit Notes (For Order Cancellations / Refunds under GST Section 34)
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  credit_note_number VARCHAR(16) NOT NULL,
  financial_year VARCHAR(10) NOT NULL,
  reason TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_credit_note_num UNIQUE (outlet_id, credit_note_number)
);

-- 6. Atomic Stored Procedure: Generate Next Monotonic Invoice Number
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(
  p_outlet_id UUID,
  p_financial_year TEXT,
  p_prefix TEXT DEFAULT 'INV/'
)
RETURNS TEXT AS $$
DECLARE
  v_seq BIGINT;
  v_invoice_num TEXT;
BEGIN
  -- Row-level lock on the sequence record to guarantee concurrency safety
  INSERT INTO public.invoice_sequences (outlet_id, financial_year, prefix, next_number, updated_at)
  VALUES (p_outlet_id, p_financial_year, p_prefix, 2, timezone('utc'::text, now()))
  ON CONFLICT (outlet_id, financial_year)
  DO UPDATE SET
    next_number = public.invoice_sequences.next_number + 1,
    updated_at = timezone('utc'::text, now())
  RETURNING (public.invoice_sequences.next_number - 1) INTO v_seq;

  -- Format as e.g. 'INV-SLI/2627/0001' (Formatted to fit <= 16 chars if desired or compact)
  -- For GST Rule 46: prefix + padded number, maximum 16 alphanumeric characters
  v_invoice_num := SUBSTRING(p_prefix || LPAD(v_seq::text, 6, '0') FROM 1 FOR 16);
  RETURN v_invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_outlet_date ON public.invoices(outlet_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON public.credit_notes(invoice_id);
-- =========================================================================
-- MIGRATION 00005: Row Level Security (RLS) & Multi-Tenant Authorization
-- Description: Centralized tenant isolation, outlet scoping, and granular RBAC evaluation functions
-- =========================================================================

-- 1. Helper Function: Get profile ID for authenticated auth.users
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper Function: Check if user is Platform Super Admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Helper Function: Get Tenant IDs for Current User
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID) AS $$
  SELECT tm.tenant_id
  FROM public.tenant_memberships tm
  JOIN public.profiles p ON p.id = tm.profile_id
  WHERE p.auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Helper Function: Get Outlet IDs for Current User
CREATE OR REPLACE FUNCTION public.get_user_outlet_ids()
RETURNS TABLE (outlet_id UUID) AS $$
  SELECT om.outlet_id
  FROM public.outlet_memberships om
  JOIN public.profiles p ON p.id = om.profile_id
  WHERE p.auth_user_id = auth.uid() AND om.status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Helper Function: Check Effective Permission for an Outlet
CREATE OR REPLACE FUNCTION public.has_permission(p_outlet_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_membership_id UUID;
  v_override_granted BOOLEAN;
  v_role_has_perm BOOLEAN;
BEGIN
  -- Super Admin bypasses all checks
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  -- Find active outlet membership for current user
  SELECT om.id INTO v_membership_id
  FROM public.outlet_memberships om
  JOIN public.profiles p ON p.id = om.profile_id
  WHERE om.outlet_id = p_outlet_id AND p.auth_user_id = auth.uid() AND om.status = 'active'
  LIMIT 1;

  IF v_membership_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check user-level override first (takes precedence)
  SELECT upo.granted INTO v_override_granted
  FROM public.user_permission_overrides upo
  JOIN public.permissions p ON p.id = upo.permission_id
  WHERE upo.outlet_membership_id = v_membership_id AND p.code = p_permission_code;

  IF v_override_granted IS NOT NULL THEN
    RETURN v_override_granted;
  END IF;

  -- 2. Check role permissions
  SELECT EXISTS (
    SELECT 1
    FROM public.outlet_memberships om
    JOIN public.role_permissions rp ON rp.role_id = om.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE om.id = v_membership_id AND p.code = p_permission_code
  ) INTO v_role_has_perm;

  RETURN COALESCE(v_role_has_perm, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY ACROSS ALL ENTITIES
-- =========================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_gst_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================================================

-- Tenants
CREATE POLICY "Tenants readable by members or platform admin"
  ON public.tenants FOR SELECT
  USING (
    public.is_platform_admin() OR
    id IN (SELECT tenant_id FROM public.get_user_tenant_ids())
  );

CREATE POLICY "Tenants updatable by platform admin or owner"
  ON public.tenants FOR UPDATE
  USING (
    public.is_platform_admin() OR
    id IN (
      SELECT tm.tenant_id FROM public.tenant_memberships tm
      WHERE tm.profile_id = public.get_current_profile_id() AND tm.is_owner = true
    )
  );

-- Outlets
CREATE POLICY "Outlets readable by tenant members"
  ON public.outlets FOR SELECT
  USING (
    public.is_platform_admin() OR
    tenant_id IN (SELECT tenant_id FROM public.get_user_tenant_ids())
  );

-- Categories & Products
CREATE POLICY "Menu readable by outlet staff or tenant members"
  ON public.categories FOR SELECT
  USING (
    public.is_platform_admin() OR
    tenant_id IN (SELECT tenant_id FROM public.get_user_tenant_ids())
  );

CREATE POLICY "Products readable by tenant members"
  ON public.products FOR SELECT
  USING (
    public.is_platform_admin() OR
    tenant_id IN (SELECT tenant_id FROM public.get_user_tenant_ids())
  );

CREATE POLICY "Products modifiable by staff with menu permission"
  ON public.products FOR ALL
  USING (
    public.is_platform_admin() OR
    (tenant_id IN (SELECT tenant_id FROM public.get_user_tenant_ids()) AND (
      outlet_id IS NULL OR public.has_permission(outlet_id, 'menu.manage')
    ))
  );

-- Tables
CREATE POLICY "Tables readable by outlet staff"
  ON public.dining_tables FOR SELECT
  USING (
    public.is_platform_admin() OR
    outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
  );

CREATE POLICY "Tables updatable by outlet staff with pos permission"
  ON public.dining_tables FOR UPDATE
  USING (
    public.is_platform_admin() OR
    (outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND public.has_permission(outlet_id, 'pos.access'))
  );

-- Orders
CREATE POLICY "Orders readable by outlet staff"
  ON public.orders FOR SELECT
  USING (
    public.is_platform_admin() OR
    outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
  );

CREATE POLICY "Orders insertable by staff with order create permission"
  ON public.orders FOR INSERT
  WITH CHECK (
    public.is_platform_admin() OR
    (outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND public.has_permission(outlet_id, 'orders.create'))
  );

CREATE POLICY "Orders updatable by staff with order permission"
  ON public.orders FOR UPDATE
  USING (
    public.is_platform_admin() OR
    (outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND (
      public.has_permission(outlet_id, 'orders.create') OR
      public.has_permission(outlet_id, 'orders.cancel')
    ))
  );

-- Order Items
CREATE POLICY "Order items readable by outlet staff"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        public.is_platform_admin() OR
        o.outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
      )
    )
  );

CREATE POLICY "Order items insertable by order creators"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        public.is_platform_admin() OR
        (o.outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND public.has_permission(o.outlet_id, 'orders.create'))
      )
    )
  );

-- KDS Tickets
CREATE POLICY "KDS tickets readable by outlet kitchen or POS staff"
  ON public.kds_tickets FOR SELECT
  USING (
    public.is_platform_admin() OR
    outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
  );

CREATE POLICY "KDS tickets modifiable by kitchen staff"
  ON public.kds_tickets FOR ALL
  USING (
    public.is_platform_admin() OR
    (outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND (
      public.has_permission(outlet_id, 'kds.access') OR
      public.has_permission(outlet_id, 'pos.access')
    ))
  );

-- Invoices
CREATE POLICY "Invoices readable by outlet staff or owners"
  ON public.invoices FOR SELECT
  USING (
    public.is_platform_admin() OR
    outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
  );

CREATE POLICY "Invoices insertable by cashiers"
  ON public.invoices FOR INSERT
  WITH CHECK (
    public.is_platform_admin() OR
    (outlet_id IN (SELECT outlet_id FROM public.get_user_outlet_ids()) AND public.has_permission(outlet_id, 'payments.manage'))
  );

-- Profiles
CREATE POLICY "Profiles readable by authenticated users in same tenant"
  ON public.profiles FOR SELECT
  USING (
    public.is_platform_admin() OR
    auth.uid() = auth_user_id OR
    id IN (
      SELECT tm.profile_id FROM public.tenant_memberships tm
      WHERE tm.tenant_id IN (SELECT tenant_id FROM public.get_user_tenant_ids())
    )
  );

CREATE POLICY "Profiles updatable by owner or self"
  ON public.profiles FOR UPDATE
  USING (
    public.is_platform_admin() OR
    auth.uid() = auth_user_id
  );
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
-- =========================================================================
-- MIGRATION 00007: Seed Sign Laban Menu Catalog (Categories, Products & Modifiers)
-- =========================================================================

-- 1. Categories
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Qashtuta (Tres Leches)', 'qashtuta', 1)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Umm Ali (Warm)', 'umm_ali', 2)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Koushiri & Ambalyh', 'koushiri', 3)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bambooza & Halibo', 'bambooza', 4)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lou''a Bites', 'loua', 5)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Signatures & Cakes', 'signatures', 6)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Aseerathul & Drinks', 'beverages', 7)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Combos & Dips', 'combos', 8)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Modifier Groups & Options
INSERT INTO public.modifier_groups (id, tenant_id, outlet_id, name, min_selection, max_selection, is_required)
VALUES ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Extra Sauces & Drizzles', 0, 3, false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Extra Pistachio Drizzle', 60.00, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Extra Lotus Biscoff Sauce', 50.00, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Extra Warm Nutella', 50.00, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Belgian Chocolate Sauce', 50.00, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'White Kinder Hazelnut Cream', 60.00, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_groups (id, tenant_id, outlet_id, name, min_selection, max_selection, is_required)
VALUES ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Crunch & Add-ons', 0, 2, false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000002', 'Toasted Golden Kunafa', 40.00, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000002', 'Roasted Hazelnuts & Praline', 45.00, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000002', 'Crushed Oreo Crumble', 35.00, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000002', 'Fresh Alphonso Mango Cubes', 50.00, 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Pistachio', '', 'Tres Leches Egyptian milk sponge cake soaked in pistachio milk, layered with fresh cream and rich Iranian pistachio paste.', 320.00, '996331', true, '/assets/products/sign_laban/QashtutaPistachio.png', 1)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Lotus', '', 'Soft milk sponge soaked in Biscoff infused milk, whipped cream, and crowned with caramelized Lotus cookie crumble.', 280.00, '996331', true, '/assets/products/sign_laban/QashtutaLotus.png', 2)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Mango', '', 'Tres Leches milk cake layered with fresh Alphonso mango pulp and succulent sweet mango cubes.', 260.00, '996331', true, '/assets/products/sign_laban/QashtutaMango.png', 3)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Nutella Hazelnut', '', 'Egyptian milk sponge drenched in chocolate milk, smothered with Nutella fudge and roasted crunchy hazelnuts.', 290.00, '996331', true, '/assets/products/sign_laban/QashtutaNutellahazelnut.png', 4)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio', '', 'Traditional warm Egyptian puff pastry pudding baked with hot vanilla milk, sweet Ashta cream, and roasted Iranian pistachios.', 290.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachio.png', 5)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Lotus', '', 'Warm flaky pastry pudding bathed in caramelized Lotus milk, topped with warm Biscoff spread and golden crumbs.', 270.00, '996331', true, '/assets/products/sign_laban/UmmAliLotus.png', 6)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Nutella', '', 'Warm Egyptian milk pudding covered with melted silky Nutella and toasted almond flakes.', 270.00, '996331', true, '/assets/products/sign_laban/UmmAliNutella.png', 7)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio Nutella', '', 'The ultimate duo: half warm pistachio cream, half melted Nutella over baked Egyptian puff pudding.', 320.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachioNutella.png', 8)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio Lotus', '', 'Signature half-and-half bowl: rich warm pistachio praline and Belgian Lotus Biscoff glaze.', 320.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachioLotus.png', 9)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Koushiri Sweet Pistachio', '', 'Sweet dessert rendition of Egypt national dish: toasted crunchy kunafa noodles, velvety rice pudding cream, toasted nuts, and pistachio drizzle.', 310.00, '996331', true, '/assets/products/sign_laban/KoushiriPistachio.png', 10)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Koushiri Sweet Lotus', '', 'Crisp toasted kunafa threads layered with sweetened clotted milk cream and warm Lotus Biscoff caramel.', 280.00, '996331', true, '/assets/products/sign_laban/KoushiriLotus.png', 11)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ambalyh Mango', '', 'Layered Egyptian custard pudding with sweet crushed biscuit base, thick Ashta, and sweet Alphonso mango cubes.', 260.00, '996331', true, '/assets/products/sign_laban/AmbalyhMango.png', 12)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ambalyh Lotus', '', 'Classic Egyptian dessert bowl with layers of milk cream custard, Lotus biscuit butter, and cinnamon aroma.', 270.00, '996331', true, '/assets/products/sign_laban/AmbalyhLotus.png', 13)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Pistachio', '', 'Viral Egyptian Bambooza dessert bowl with soft milk cake base, crunchy toasted kunafa nest, and double pistachio cream.', 330.00, '996331', true, '/assets/products/sign_laban/BamboozaPistachio.png', 14)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Lotus', '', 'Bambooza bowl layered with sweet soaked sponge, Biscoff cookie crunch, and velvety caramel glaze.', 290.00, '996331', true, '/assets/products/sign_laban/BamboozaLotus.png', 15)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Nutella', '', 'Luscious Bambooza bowl drenched in rich Nutella hazelnut sauce and crunchy wafer crisps.', 290.00, '996331', true, '/assets/products/sign_laban/BamboozaNutella.png', 16)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Mango', '', 'Tropical Bambooza bowl layered with chilled milk sponge, sweet mango cream, and fresh diced mango.', 270.00, '996331', true, '/assets/products/sign_laban/BamboozaMango.png', 17)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Pistachio', '', 'Fluffy whipped milk mousse cup infused with real pistachio cream and crushed roasted nuts.', 310.00, '996331', true, '/assets/products/sign_laban/HaliboPistachio.png', 18)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Nutella', '', 'Chilled chocolate milk mousse cup with Nutella chocolate ribbons and biscuit crumble.', 280.00, '996331', true, '/assets/products/sign_laban/HaliboNutella.png', 19)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Lotus', '', 'Creamy whipped Ashta milk mousse layered with Lotus Biscoff butter and cookie crumbs.', 280.00, '996331', true, '/assets/products/sign_laban/HaliboLotus.png', 20)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Pistachio Bites', '', 'Crispy golden fried sweet pastry bites smothered in warm silky pistachio cream.', 260.00, '996331', true, '/assets/products/sign_laban/LouaPistachio.png', 21)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Nutella Bites', '', 'Crunchy Egyptian pastry bite cups drenched in melted Nutella fudge.', 240.00, '996331', true, '/assets/products/sign_laban/LouaNutella.png', 22)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Lotus Bites', '', 'Crispy golden bite cups generously coated in warm caramelized Lotus Biscoff glaze.', 240.00, '996331', true, '/assets/products/sign_laban/LouaLotus.png', 23)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Kinder Cream Bites', '', 'Warm crispy pastry cups topped with melted white hazelnut Kinder cream and milk chocolate streaks.', 270.00, '996331', true, '/assets/products/sign_laban/LouaKinder.png', 24)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Nutella & Pistachio Duo', '', 'Half Nutella, half Pistachio sauce over warm, freshly fried crunchy pastry cups.', 290.00, '996331', true, '/assets/products/sign_laban/LouaNutellaPistachio.png', 25)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Pistachio & Lotus Duo', '', 'Duo of warm pistachio cream and Lotus Biscoff sauce poured over crispy sweet pastry cups.', 290.00, '996331', true, '/assets/products/sign_laban/LouaPistachioLotus.png', 26)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Saankorita Dessert Tower', '', 'The viral Egyptian dessert sensation: multi-layered crunchy kunafa tower, fresh Ashta cream, Lotus crumble, and pistachio sauce.', 360.00, '996331', true, '/assets/products/sign_laban/SAANKORITA.png', 27)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'The Egyptian Bomb', '', 'Signature crisp chocolate kunafa sphere filled with molten clotted cream, pistachio paste, and warm Nutella lava.', 380.00, '996331', true, '/assets/products/sign_laban/bomb.png', 28)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'De Paris Mascarpone Kunafa', '', 'French-Egyptian fusion pastry layered with whipped mascarpone cream, dark Belgian chocolate, and crispy pastry flakes.', 340.00, '996331', true, '/assets/products/sign_laban/deparis.png', 29)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Elsabika Gold Ingot', '', 'Golden ingot dessert cake layered with sweet clotted Ashta cream, honey syrup, and roasted pistachios.', 350.00, '996331', true, '/assets/products/sign_laban/Elsabika.png', 30)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Almazeya Rose Milk Cup', '', 'Egyptian diamond dessert cup infused with natural rosewater milk, sweet cream, and crushed Iranian pistachios.', 320.00, '996331', true, '/assets/products/sign_laban/almazeya.png', 31)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kashkha Royal Ashta', '', 'Royal Egyptian dessert with rich fresh Ashta cream, toasted kunafa threads, and edible silver leaf garnishing.', 350.00, '996331', true, '/assets/products/sign_laban/KASHKHA.png', 32)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fazea Chocolate Pot', '', 'Decadent dark chocolate and crunchy kunafa pot with molten chocolate center and crushed biscuit base.', 330.00, '996331', true, '/assets/products/sign_laban/fazea.png', 33)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fazea Pistachio Sponge Cake', '', 'Moist layered pistachio sponge cake smothered in rich pistachio ganache and toasted chopped pistachios.', 360.00, '996331', true, '/assets/products/sign_laban/fezea-pistachio-cake.png', 34)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hazelnut Praline Kunafa Bar', '', 'Crunchy wafer and kunafa bar filled with roasted hazelnut praline, dipped in Belgian milk chocolate.', 280.00, '996331', true, '/assets/products/sign_laban/hazeel-nut-bar.png', 35)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'London Love Story Kunafa', '', 'Romantic dessert bowl with sweet fresh strawberries, clotted whipped cream, and Belgian milk chocolate kunafa.', 350.00, '996331', true, '/assets/products/sign_laban/london-love-story.png', 36)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qishta Clotted Cream Bowl', '', 'Authentic traditional Egyptian clotted buffalo cream bowl served with pure mountain honey and raw almonds.', 260.00, '996331', true, '/assets/products/sign_laban/QISHTA.png', 37)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kab''sa Sweet Kunafa Bowl', '', 'Playful dessert resembling golden saffron rice crafted with sweet toasted kunafa, saffron cream, and pistachios.', 340.00, '996331', true, '/assets/products/sign_laban/kabsa.png', 38)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Roh Hayati Almond Milk Cup', '', 'Heart of Life Egyptian milk dessert perfumed with green cardamom, sweet cream, and slivered blanched almonds.', 330.00, '996331', true, '/assets/products/sign_laban/rohhayati.png', 39)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Pistachio Shake', '', 'Thick Egyptian chilled bottled shake blended with pure Iranian pistachio paste, cold milk, and crushed pistachios.', 240.00, '996331', true, '/assets/products/sign_laban/Aseerathulpistachio.png', 40)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Nutella Shake', '', 'Rich and creamy chilled bottled shake with authentic Nutella and chocolate cream.', 220.00, '996331', true, '/assets/products/sign_laban/AseerathulNutella.png', 41)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Lotus Shake', '', 'Signature spiced Biscoff cookie shake blended with clotted cream and cold full-cream milk.', 220.00, '996331', true, '/assets/products/sign_laban/Aseerathullotus.png', 42)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pure Alphonso Mango Shake', '', '100% pure Alphonso mango pulp blended with chilled whole milk and sweet syrup.', 180.00, '996331', true, '/assets/products/sign_laban/Mango.png', 43)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mango Strawberry Nectar', '', 'Refreshing duo of golden Alphonso mango and fresh mountain strawberry nectar.', 200.00, '996331', true, '/assets/products/sign_laban/MangoStrawberry.png', 44)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mango Banana Smoothie', '', 'Creamy tropical blend of sweet mango and ripe banana with honey.', 190.00, '996331', true, '/assets/products/sign_laban/MangoBanana.png', 45)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Banana Strawberry Shake', '', 'Classic combination of farm strawberries and fresh bananas with chilled cream.', 190.00, '996331', true, '/assets/products/sign_laban/BananaStrawberry.png', 46)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Anar Tender Coconut Nectar', '', 'Fresh ruby pomegranate pearls infused in sweet coastal tender coconut water and malai.', 210.00, '996331', true, '/assets/products/sign_laban/AnarTenderCoconut.png', 47)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Nutella + Bomb Combo', '', 'Power combo: 1x Chilled Bottled Aseerathul Nutella Shake + 1x Signature Egyptian Chocolate Bomb.', 499.00, '996331', true, '/assets/products/sign_laban/img1.png', 48)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000048', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000048', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Lotus + Lou''a Cup Combo', '', 'Signature combo: 1x Bottled Aseerathul Lotus Shake + 1x Lou''a Crispy Pastry Bites Bowl.', 449.00, '996331', true, '/assets/products/sign_laban/img2.png', 49)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000049', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000049', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Pistachio + Kab''sa Combo', '', 'The Royal Green combo: 1x Bottled Aseerathul Pistachio Shake + 1x Sweet Kab''sa Kunafa Bowl.', 520.00, '996331', true, '/assets/products/sign_laban/img3.png', 50)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000050', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000050', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pure Pistachio Spread Dip Jar', '', 'Extra takeaway jar of 100% natural Iranian pistachio spread.', 75.00, '996331', true, '/assets/products/sign_laban/Pistachio.png', 51)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lotus Biscoff Sauce Jar', '', 'Extra takeaway jar of warm caramelized Lotus Biscoff spread.', 60.00, '996331', true, '/assets/products/sign_laban/Lotus.png', 52)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Warm Nutella Fudge Jar', '', 'Extra takeaway jar of velvety warm Nutella chocolate.', 60.00, '996331', true, '/assets/products/sign_laban/Nutella.png', 53)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Belgian Dark Chocolate Dip', '', 'Rich melted Belgian chocolate sauce cup.', 60.00, '996331', true, '/assets/products/sign_laban/Chocolate.png', 54)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella & Lotus Duo Dip', '', 'Split twin dip cup with Nutella and Lotus Biscoff sauces.', 70.00, '996331', true, '/assets/products/sign_laban/NutellaLotus.png', 55)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella & Pistachio Duo Dip', '', 'Split twin dip cup with melted Nutella and Iranian pistachio cream.', 75.00, '996331', true, '/assets/products/sign_laban/NutellaPistachio.png', 56)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella Hazelnut Crunch Dip', '', 'Nutella sauce cup mixed with crushed roasted hazelnuts.', 75.00, '996331', true, '/assets/products/sign_laban/Nutellahazelnut.png', 57)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio & Lotus Duo Dip', '', 'Split twin dip cup with pistachio cream and Lotus Biscoff spread.', 75.00, '996331', true, '/assets/products/sign_laban/PistachioLotus.png', 58)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio Kinder White Dip', '', 'Warm pistachio sauce blended with melted white Kinder cream.', 80.00, '996331', true, '/assets/products/sign_laban/PistachioKinderChocolate.png', 59)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio Belgian Chocolate Dip', '', 'Pure pistachio cream swirled with Belgian chocolate.', 80.00, '996331', true, '/assets/products/sign_laban/PistachiobelgiumChocolate.png', 60)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Crushed Oreo Cookie Cup', '', 'Crunchy crushed Oreo cookies for topping over desserts.', 45.00, '996331', true, '/assets/products/sign_laban/Oreo.png', 61)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
