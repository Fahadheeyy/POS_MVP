-- Return only the signed-in employee's active outlet and scoped permissions.
CREATE FUNCTION public.get_pos_session(p_outlet uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', p.id, 'email', p.email, 'name', p.name, 'phone', p.phone,
    'avatarInitials', p.avatar_initials, 'title', p.title, 'active', true,
    'role', r.code, 'pin', '', 'outletId', o.id, 'tenantId', t.id,
    'stateCode', s.code, 'outletName', o.name,
    'effectivePermissions', coalesce((
      SELECT jsonb_agg(perm.code)
      FROM public.permissions perm
      LEFT JOIN public.user_permission_overrides override
        ON override.outlet_membership_id = m.id AND override.permission_id = perm.id
      LEFT JOIN public.role_permissions rp ON rp.role_id = r.id AND rp.permission_id = perm.id
      WHERE coalesce(override.granted, rp.id IS NOT NULL)
    ), '[]'::jsonb)
  )
  FROM public.profiles p
  JOIN public.outlet_memberships m ON m.profile_id = p.id AND m.status = 'active'
  JOIN public.outlets o ON o.id = m.outlet_id AND o.status = 'active'
  JOIN public.tenants t ON t.id = o.tenant_id AND t.status = 'active'
  JOIN public.roles r ON r.id = m.role_id
  LEFT JOIN public.states s ON s.id = o.state_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active
    AND (p_outlet IS NULL OR o.id = p_outlet)
  ORDER BY m.is_primary DESC, m.created_at, m.id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_pos_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pos_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.is_platform_super_admin() $$;

-- A staff user may edit their own display fields, but account status and
-- identity linkage are administered separately through trusted provisioning.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (name, phone, avatar_initials) ON public.profiles TO authenticated;


CREATE FUNCTION public.get_pos_outlets()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name) ORDER BY o.name), '[]')
  FROM public.outlets o
  WHERE o.id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
$$;
REVOKE ALL ON FUNCTION public.get_pos_outlets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pos_outlets() TO authenticated;

-- Legacy PIN hashes and fiscal counters are internal database records.
ALTER TABLE public.staff_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_pins FROM PUBLIC, anon, authenticated;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invoice_sequences FROM PUBLIC, anon, authenticated;
