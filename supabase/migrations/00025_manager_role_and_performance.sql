-- 1. Deactivate empty placeholder 'Menu' categories that cause empty-grid bugs on Counter POS.
UPDATE public.categories c
SET is_active = false, updated_at = now()
WHERE c.slug = 'menu'
  AND NOT EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.category_id = c.id AND p.is_active
  );

-- 2. Allow Outlet Owners to invite and manage Managers (alongside Cashiers & Kitchen staff),
--    while Managers continue managing Cashiers & Kitchen staff (never Owners or Managers).
CREATE OR REPLACE FUNCTION public.invite_outlet_staff(p_outlet uuid, p_email text, p_name text, p_role text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  result uuid;
  role_key uuid;
  session jsonb := public.get_pos_session(p_outlet);
  caller_role text := session->>'role';
BEGIN
  IF p_role IS NULL OR p_role NOT IN ('owner','manager','cashier','kitchen') OR NOT (
    public.is_platform_super_admin() OR
    (
      coalesce(session->'effectivePermissions' ? 'staff.manage', false)
      AND (session->>'outletId')::uuid = p_outlet
      AND (
        (caller_role = 'owner' AND p_role IN ('manager','cashier','kitchen')) OR
        (caller_role = 'manager' AND p_role IN ('cashier','kitchen'))
      )
    )
  ) THEN RAISE EXCEPTION 'Staff invitation permission required' USING ERRCODE = '42501'; END IF;

  IF coalesce(length(trim(p_name)),0) NOT BETWEEN 1 AND 120 OR
    coalesce(trim(p_email),'') !~ '^[^ @]+@[^ @]+\.[^ @]+$' OR length(p_email)>254 THEN
    RAISE EXCEPTION 'Enter a name and email address';
  END IF;

  SELECT id INTO STRICT role_key FROM public.roles WHERE code=p_role AND tenant_id IS NULL AND is_system;
  INSERT INTO public.staff_invitations(outlet_id,email,name,role_id)
    VALUES(p_outlet,lower(trim(p_email)),trim(p_name),role_key)
    ON CONFLICT(outlet_id,email) DO UPDATE SET name=excluded.name,role_id=excluded.role_id,
      token=gen_random_uuid(), expires_at=excluded.expires_at
    RETURNING token INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_outlet_staff(p_outlet uuid, p_staff uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  caller_role text := session->>'role';
  can_disable_manager boolean := public.is_platform_super_admin() OR caller_role = 'owner';
BEGIN
  IF NOT coalesce(session->'effectivePermissions' ? 'staff.manage', false) OR
    (session->>'outletId')::uuid IS DISTINCT FROM p_outlet THEN
    RAISE EXCEPTION 'Staff permission required' USING ERRCODE='42501';
  END IF;

  UPDATE public.outlet_memberships m SET status='inactive', updated_at=now() FROM public.roles r
    WHERE m.role_id=r.id
      AND (
        r.code IN ('cashier','kitchen')
        OR (can_disable_manager AND r.code = 'manager')
      )
      AND m.profile_id=p_staff AND m.outlet_id=p_outlet;
  IF NOT FOUND THEN RAISE EXCEPTION 'This staff assignment cannot be disabled'; END IF;

  DELETE FROM public.staff_invitations i USING public.profiles p
    WHERE p.id=p_staff AND i.email=lower(p.email) AND i.outlet_id=p_outlet;
  DELETE FROM public.tenant_memberships tm
    WHERE tm.profile_id=p_staff AND NOT tm.is_owner AND tm.tenant_id=(session->>'tenantId')::uuid
      AND NOT EXISTS(
        SELECT 1 FROM public.outlet_memberships m JOIN public.outlets o ON m.outlet_id=o.id
        WHERE m.profile_id=p_staff AND m.status='active' AND o.tenant_id=tm.tenant_id
      );
END;
$$;

-- 3. Covering indexes for high-concurrency (50+ users) workspace reads and KDS polling
CREATE INDEX IF NOT EXISTS idx_orders_outlet_created_snapshot
  ON public.orders (outlet_id, created_at DESC)
  WHERE pos_snapshot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kds_tickets_outlet_active_snapshot
  ON public.kds_tickets (outlet_id, created_at DESC)
  WHERE pos_snapshot IS NOT NULL AND status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_outlet_memberships_active_lookup
  ON public.outlet_memberships (outlet_id, status, profile_id);

CREATE INDEX IF NOT EXISTS idx_products_tenant_outlet_active
  ON public.products (tenant_id, outlet_id, display_order)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_categories_tenant_outlet_active
  ON public.categories (tenant_id, outlet_id, display_order)
  WHERE is_active;
