CREATE POLICY "Super admins can read tenant subscriptions"
ON public.tenant_subscriptions FOR SELECT TO authenticated
USING (public.is_platform_super_admin());

CREATE POLICY "Super admins can read tenant features"
ON public.tenant_feature_overrides FOR SELECT TO authenticated
USING (public.is_platform_super_admin());

CREATE POLICY "Super admins can read outlet profiles"
ON public.outlet_business_profiles FOR SELECT TO authenticated
USING (public.is_platform_super_admin());

GRANT SELECT ON public.tenant_subscriptions, public.tenant_feature_overrides,
  public.outlet_business_profiles, public.subscription_plans, public.plan_features,
  public.outlets, public.states TO authenticated;

CREATE FUNCTION public.configure_platform_tenant(
  p_tenant_id uuid,
  p_operation text,
  p_values jsonb,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_outlet_id uuid;
  v_outlet_code text;
  v_fssai text;
  v_plan_id uuid;
  v_feature text;
  v_enabled boolean;
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'An audit reason is required' USING ERRCODE = '22023';
  END IF;

  -- Serialize changes for a single tenant and prevent races with tenant lifecycle updates.
  PERFORM 1 FROM public.tenants WHERE id = p_tenant_id AND status <> 'archived' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant is missing or archived' USING ERRCODE = '22023';
  END IF;

  CASE p_operation
    WHEN 'outlet.created' THEN
      v_outlet_code := p_values->>'code';
      v_fssai := p_values->>'fssai';
      IF coalesce(v_outlet_code, '') !~ '^[A-Z0-9][A-Z0-9-]{0,23}$'
         OR coalesce(v_fssai, '') !~ '^[0-9]{14}$'
         OR coalesce(p_values->>'pincode', '') !~ '^[1-9][0-9]{5}$'
         OR coalesce(p_values->>'phone', '') !~ '^\+?[0-9]{10,15}$'
         OR coalesce(p_values->>'email', '') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
         OR char_length(btrim(coalesce(p_values->>'name', ''))) NOT BETWEEN 1 AND 120
         OR char_length(btrim(coalesce(p_values->>'city', ''))) NOT BETWEEN 1 AND 120
         OR char_length(btrim(coalesce(p_values->>'address', ''))) NOT BETWEEN 1 AND 240 THEN
        RAISE EXCEPTION 'Invalid outlet configuration' USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.outlets (tenant_id, name, code, status, address_line1, city, state_id, pincode, phone, email)
      SELECT p_tenant_id, btrim(p_values->>'name'), v_outlet_code, 'temporarily_closed',
        btrim(p_values->>'address'), btrim(p_values->>'city'), id,
        p_values->>'pincode', p_values->>'phone', p_values->>'email'
      FROM public.states WHERE code = p_values->>'state' AND is_active
      RETURNING id INTO v_outlet_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown state code' USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.outlet_business_profiles (outlet_id, fssai_number)
      VALUES (v_outlet_id, v_fssai);
      v_after := jsonb_build_object('code', v_outlet_code, 'status', 'temporarily_closed');

    WHEN 'outlet.status_changed' THEN
      v_outlet_id := (p_values->>'outletId')::uuid;
      IF coalesce(p_values->>'status', '') NOT IN ('active', 'temporarily_closed', 'archived') THEN
        RAISE EXCEPTION 'Invalid outlet status' USING ERRCODE = '22023';
      END IF;
      SELECT jsonb_build_object('status', status) INTO STRICT v_before
      FROM public.outlets WHERE id = v_outlet_id AND tenant_id = p_tenant_id FOR UPDATE;
      UPDATE public.outlets SET status = p_values->>'status', updated_at = now()
      WHERE id = v_outlet_id AND tenant_id = p_tenant_id;
      v_after := jsonb_build_object('status', p_values->>'status');

    WHEN 'subscription.plan_changed' THEN
      SELECT id INTO STRICT v_plan_id FROM public.subscription_plans
      WHERE code = p_values->>'plan' AND is_active;

      SELECT jsonb_build_object('plan_id', plan_id) INTO v_before
      FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;

      INSERT INTO public.tenant_subscriptions (tenant_id, plan_id, status)
      VALUES (p_tenant_id, v_plan_id, 'trialing')
      ON CONFLICT (tenant_id) DO UPDATE SET plan_id = excluded.plan_id, updated_at = now();
      v_after := jsonb_build_object('plan_id', v_plan_id, 'plan', p_values->>'plan');

    WHEN 'feature.override_changed' THEN
      v_feature := p_values->>'feature';
      IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE feature_key = v_feature)
         OR coalesce(p_values->>'mode', '') NOT IN ('enabled', 'disabled', 'inherit') THEN
        RAISE EXCEPTION 'Invalid feature or override mode' USING ERRCODE = '22023';
      END IF;

      SELECT jsonb_build_object('feature', v_feature, 'enabled', is_enabled) INTO v_before
      FROM public.tenant_feature_overrides WHERE tenant_id = p_tenant_id AND feature_key = v_feature;

      IF p_values->>'mode' = 'inherit' THEN
        DELETE FROM public.tenant_feature_overrides WHERE tenant_id = p_tenant_id AND feature_key = v_feature;
      ELSE
        v_enabled := p_values->>'mode' = 'enabled';
        INSERT INTO public.tenant_feature_overrides (tenant_id, feature_key, is_enabled, reason, granted_by)
        VALUES (p_tenant_id, v_feature, v_enabled, btrim(p_reason), auth.uid())
        ON CONFLICT (tenant_id, feature_key) DO UPDATE
        SET is_enabled = excluded.is_enabled, reason = excluded.reason,
          granted_by = excluded.granted_by, updated_at = now();
      END IF;
      v_after := jsonb_build_object('feature', v_feature, 'mode', p_values->>'mode');
    ELSE
      RAISE EXCEPTION 'Unknown tenant operation' USING ERRCODE = '22023';
  END CASE;

  INSERT INTO public.audit_logs (tenant_id, outlet_id, actor_profile_id, action, entity_type,
    entity_id, old_values, new_values, metadata)
  VALUES (p_tenant_id, v_outlet_id, public.get_current_profile_id(), p_operation,
    CASE WHEN v_outlet_id IS NULL THEN 'tenant' ELSE 'outlet' END,
    coalesce(v_outlet_id, p_tenant_id)::text, v_before, v_after,
    jsonb_build_object('auth_user_id', auth.uid(), 'reason', btrim(p_reason)));
END;
$$;

REVOKE ALL ON FUNCTION public.configure_platform_tenant(uuid, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configure_platform_tenant(uuid, text, jsonb, text) TO authenticated;

CREATE POLICY "Super admins can read tenant configuration audit"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  action IN ('outlet.created', 'outlet.status_changed', 'subscription.plan_changed', 'feature.override_changed')
  AND public.is_platform_super_admin()
);
