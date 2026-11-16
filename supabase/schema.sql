-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA & AUTHENTICATION SETUP FOR SIGN LABAN POS
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- =========================================================================

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Staff Profiles Table (Linked to auth.users or standalone terminal access)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('cashier', 'kitchen', 'manager', 'owner', 'admin')),
  pin TEXT NOT NULL, -- 4-digit terminal PIN
  pin_hash TEXT,    -- Optional bcrypt hash
  avatar_initials TEXT DEFAULT 'SL',
  title TEXT DEFAULT 'Staff',
  tenant_id TEXT DEFAULT 'biz_sign_laban_indiranagar',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Business Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'QSR',
  address TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  fssai TEXT,
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  plan_tier TEXT DEFAULT 'growth',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated reads and public staff PIN queries for terminals
CREATE POLICY "Allow public read for active profiles" 
  ON public.profiles FOR SELECT 
  USING (active = true);

CREATE POLICY "Allow authenticated profile updates" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Allow public read for tenants" 
  ON public.tenants FOR SELECT 
  USING (status = 'active');

-- 5. Seed Initial Store Tenant: Sign Laban Indiranagar
INSERT INTO public.tenants (id, name, brand_name, slug, category, address, phone, email, gstin, fssai)
VALUES (
  'biz_sign_laban_indiranagar',
  'Sign Laban · Indiranagar',
  'Sign Laban',
  'sign-laban-blr',
  'Dessert QSR Flagship',
  '12th Main Rd, Indiranagar, Bengaluru, KA 560038',
  '+91 80 4123 4567',
  'indiranagar@signlaban.in',
  '29AABCS1429B1Z8',
  '11223334000123'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Initial Staff Members into public.profiles
INSERT INTO public.profiles (name, email, phone, role, pin, avatar_initials, title, tenant_id)
VALUES 
  ('Priya Sharma', 'priya@signlaban.in', '+91 98765 43211', 'cashier', '1234', 'PR', 'Head Cashier', 'biz_sign_laban_indiranagar'),
  ('Jesselyn Tan', 'jesselyn@signlaban.in', '+91 98765 43210', 'kitchen', '1111', 'JE', 'Kitchen Lead', 'biz_sign_laban_indiranagar'),
  ('Marcus Chen', 'marcus@signlaban.in', '+91 98765 43212', 'kitchen', '2222', 'MA', 'Kitchen Cook', 'biz_sign_laban_indiranagar'),
  ('Alex Rivera', 'alex@signlaban.in', '+91 98765 43213', 'manager', '9999', 'AL', 'Store & Shift Manager', 'biz_sign_laban_indiranagar'),
  ('Vikram Sethi', 'vikram@signlaban.in', '+91 98765 43214', 'owner', '8888', 'VI', 'Franchise Owner', 'biz_sign_laban_indiranagar'),
  ('Dev Operations', 'admin@posbits.io', '+91 99000 00000', 'admin', '0000', 'AD', 'Platform Super Admin', 'biz_sign_laban_indiranagar')
ON CONFLICT (email) DO UPDATE 
SET pin = EXCLUDED.pin, role = EXCLUDED.role;

-- 7. Trigger to Auto-create or link Profile on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, name, role, pin, avatar_initials, title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cashier'),
    COALESCE(NEW.raw_user_meta_data->>'pin', '1234'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_initials', 'SL'),
    COALESCE(NEW.raw_user_meta_data->>'title', 'Store Staff')
  )
  ON CONFLICT (email) DO UPDATE
  SET auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
