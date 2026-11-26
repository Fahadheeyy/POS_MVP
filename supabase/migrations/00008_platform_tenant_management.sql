-- Platform operator records are managed through privileged provisioning.
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.is_platform_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND status = 'active' AND is_super_admin
  );
$$;

CREATE FUNCTION public.manage_platform_tenant(
  p_tenant_id uuid,
  p_name text,
  p_slug text,
  p_status text,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_previous_status text;
  v_action text;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'A reason of 1–500 characters is required' USING ERRCODE = '22023';
  END IF;

  IF p_tenant_id IS NULL THEN
    IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 120
       OR p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       OR char_length(p_slug) > 80 THEN
      RAISE EXCEPTION 'Invalid tenant name or slug' USING ERRCODE = '22023';
    END IF;

    p_status := 'onboarding';
    INSERT INTO public.tenants (slug, name, brand_name, status)
    VALUES (p_slug, btrim(p_name), btrim(p_name), p_status)
    RETURNING id INTO v_tenant_id;
    v_action := 'tenant.created';
  ELSE
    IF p_status IS NULL OR p_status NOT IN ('onboarding', 'active', 'suspended', 'archived') THEN
      RAISE EXCEPTION 'Invalid tenant status' USING ERRCODE = '22023';
    END IF;

    SELECT status INTO STRICT v_previous_status
    FROM public.tenants WHERE id = p_tenant_id FOR UPDATE;
    IF v_previous_status = p_status THEN
      RETURN p_tenant_id;
    END IF;

    UPDATE public.tenants
    SET status = p_status, updated_at = now()
    WHERE id = p_tenant_id;
    v_tenant_id := p_tenant_id;
    v_action := 'tenant.status_changed';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, actor_profile_id, action, entity_type, entity_id,
    old_values, new_values, metadata
  ) VALUES (
    v_tenant_id, public.get_current_profile_id(), v_action, 'tenant', v_tenant_id::text,
    CASE WHEN v_previous_status IS NOT NULL THEN jsonb_build_object('status', v_previous_status) END,
    jsonb_build_object('status', p_status),
    jsonb_build_object('auth_user_id', auth.uid(), 'reason', btrim(p_reason))
  );

  RETURN v_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_super_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.manage_platform_tenant(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_platform_tenant(uuid, text, text, text, text) TO authenticated;

-- Route authenticated lifecycle changes through the audited operation.
REVOKE UPDATE ON public.tenants FROM PUBLIC, anon, authenticated;
GRANT UPDATE (slug, name, legal_name, brand_name, category, logo_url, metadata, updated_at)
ON public.tenants TO authenticated;

GRANT SELECT ON public.tenants, public.audit_logs TO authenticated;

CREATE POLICY "Platform super admins can read tenant lifecycle audit"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  action IN ('tenant.created', 'tenant.status_changed')
  AND public.is_platform_super_admin()
);
