-- Local and test fixtures only.
-- Seed Flagship Tenant: Sign Laban
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
