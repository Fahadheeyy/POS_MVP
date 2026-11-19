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
