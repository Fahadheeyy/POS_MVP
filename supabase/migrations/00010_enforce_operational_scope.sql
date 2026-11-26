-- Apply account, tenant and outlet status to membership-based operational RLS.
-- 3. Helper Function: Get Tenant IDs for Current User
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID) AS $$
  SELECT tm.tenant_id
  FROM public.tenant_memberships tm
  JOIN public.profiles p ON p.id = tm.profile_id
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active AND t.status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 4. Helper Function: Get Outlet IDs for Current User
CREATE OR REPLACE FUNCTION public.get_user_outlet_ids()
RETURNS TABLE (outlet_id UUID) AS $$
  SELECT om.outlet_id
  FROM public.outlet_memberships om
  JOIN public.profiles p ON p.id = om.profile_id
  JOIN public.outlets o ON o.id = om.outlet_id
  JOIN public.tenants t ON t.id = o.tenant_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active AND om.status = 'active'
    AND o.status = 'active' AND t.status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

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
  JOIN public.outlets o ON o.id = om.outlet_id
  JOIN public.tenants t ON t.id = o.tenant_id
  WHERE om.outlet_id = p_outlet_id AND p.auth_user_id = auth.uid() AND p.is_active
    AND om.status = 'active' AND o.status = 'active' AND t.status = 'active'
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Reserve the legacy sequence function for trusted database code. Issuing an
-- invoice must reserve its number and create the invoice in one transaction.
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_number(uuid, text, text)
FROM PUBLIC, anon, authenticated;
