CREATE FUNCTION public.get_register_workspace(p_outlet uuid, p_view text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  tenant uuid := (session->>'tenantId')::uuid;
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
  staff boolean := session->'effectivePermissions' ?| ARRAY['pos.access', 'orders.view', 'reports.view', 'settings.manage', 'staff.manage'];
  kitchen boolean := session->'effectivePermissions' ? 'kds.access';
  finances boolean := session->'effectivePermissions' ?| ARRAY['pos.access', 'reports.view', 'settings.manage'];
BEGIN
  IF outlet IS NULL OR NOT coalesce(staff OR kitchen, false) THEN
    RAISE EXCEPTION 'Active outlet access required' USING ERRCODE = '42501';
  END IF;
  IF p_view IS NULL OR p_view NOT IN ('counter','owner','kitchen','reports') THEN
    RAISE EXCEPTION 'Unknown workspace';
  END IF;
  IF p_view IN ('reports','owner') AND NOT (session->'effectivePermissions' ? 'reports.view') THEN
    RAISE EXCEPTION 'Reporting permission required' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'settings', CASE WHEN session->'effectivePermissions' ? 'settings.manage' OR
      coalesce((public.pos_outlet_settings(outlet)->>'showWifiOnReceipt')::boolean, false)
      THEN public.pos_outlet_settings(outlet) ELSE public.pos_outlet_settings(outlet) - 'wifiPassword' END,
    'categories', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug) ORDER BY c.display_order)
      FROM public.categories c WHERE c.tenant_id = tenant AND (c.outlet_id IS NULL OR c.outlet_id = outlet) AND c.is_active
    ), '[]'),
    'products', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'categoryId', p.category_id, 'price', p.price,
        'description', coalesce(p.description, ''), 'image', coalesce(p.image_url, ''),
        'station', coalesce(p.pos_station, 'Cold'), 'hsnCode', p.hsn_sac_code,
        'isAvailable', p.is_active, 'addOnGroupIds', coalesce((
          SELECT jsonb_agg(m.group_id) FROM public.product_modifier_groups m
          WHERE m.product_id = p.id
        ), '[]')
      ) ORDER BY p.display_order)
      FROM public.products p WHERE p.tenant_id = tenant AND (p.outlet_id IS NULL OR p.outlet_id = outlet)
    ), '[]'),
    'addOnGroups', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'minSelect', g.min_selection, 'maxSelect', g.max_selection,
        'items', coalesce((
          SELECT jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'price', m.price_delta,
            'isDefault', m.is_default, 'isAvailable', m.is_active, 'image', m.pos_image) ORDER BY m.display_order)
          FROM public.modifier_options m WHERE m.group_id = g.id
        ), '[]')))
      FROM public.modifier_groups g WHERE g.tenant_id = tenant AND (g.outlet_id IS NULL OR g.outlet_id = outlet) AND g.is_active
    ), '[]'),
    'users', CASE WHEN session->'effectivePermissions' ? 'staff.manage' THEN coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email, 'phone', p.phone,
        'pin', '', 'avatarInitials', p.avatar_initials, 'title', p.title, 'role', r.code,
        'active', p.is_active AND m.status = 'active') ORDER BY p.name)
      FROM public.profiles p JOIN public.outlet_memberships m ON m.profile_id = p.id
      JOIN public.roles r ON r.id = m.role_id WHERE m.outlet_id = outlet
    ), '[]') ELSE '[]'::jsonb END,
    'orders', CASE WHEN finances OR session->'effectivePermissions' ? 'orders.view' THEN coalesce((
      SELECT jsonb_agg(o.pos_snapshot ORDER BY o.created_at DESC) FROM public.orders o
      WHERE o.outlet_id = outlet AND o.pos_snapshot IS NOT NULL AND (
        p_view = 'reports' OR o.created_at >= day_start - CASE WHEN p_view = 'owner' THEN interval '30 days' ELSE interval '0' END
        OR o.cancelled_at >= day_start OR (p_view = 'kitchen' AND o.status IN ('preparing','ready'))
      )
    ), '[]') ELSE '[]'::jsonb END,
    'tickets', CASE WHEN kitchen OR finances THEN coalesce((
      SELECT jsonb_agg(k.pos_snapshot ORDER BY k.created_at DESC) FROM public.kds_tickets k
      WHERE k.outlet_id = outlet AND k.pos_snapshot IS NOT NULL AND k.status <> 'cancelled' AND (p_view = 'reports' OR k.status <> 'delivered' OR k.completed_at >= day_start)
    ), '[]') ELSE '[]'::jsonb END,
    'shifts', '[]'::jsonb
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_register_workspace(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_register_workspace(uuid,text) TO authenticated;
