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
