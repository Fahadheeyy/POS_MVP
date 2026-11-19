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
