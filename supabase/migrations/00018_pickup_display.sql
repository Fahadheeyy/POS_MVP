-- A display link authorizes only the active token projection for its outlet.
CREATE TABLE public.pickup_displays (
  outlet_id uuid PRIMARY KEY REFERENCES public.outlets(id) ON DELETE CASCADE,
  display_key uuid UNIQUE NOT NULL DEFAULT gen_random_uuid()
);
ALTER TABLE public.pickup_displays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pickup_displays FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.manage_pickup_display(p_outlet uuid, p_action text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  result uuid;
BEGIN
  IF (session->>'outletId')::uuid IS DISTINCT FROM p_outlet OR
    NOT coalesce(session->'effectivePermissions' ? 'settings.manage', false) THEN
    RAISE EXCEPTION 'Outlet settings access required' USING ERRCODE = '42501';
  END IF;
  IF p_action = 'open' THEN
    INSERT INTO public.pickup_displays(outlet_id) VALUES (p_outlet)
      ON CONFLICT (outlet_id) DO UPDATE SET outlet_id = excluded.outlet_id
      RETURNING display_key INTO result;
  ELSIF p_action = 'disable' THEN
    DELETE FROM public.pickup_displays WHERE outlet_id = p_outlet;
  ELSE
    RAISE EXCEPTION 'Unknown display action';
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_pickup_display(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_pickup_display(uuid,text) TO authenticated;

CREATE FUNCTION public.pickup_queue(p_key uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('outlet',o.name,'tickets',coalesce((
    SELECT jsonb_agg(jsonb_build_object('token',k.ticket_number,'ready',k.status = 'ready')
      ORDER BY k.created_at,k.id)
    FROM public.kds_tickets k WHERE k.outlet_id = o.id AND k.status IN ('pending','preparing','ready')
  ),'[]'::jsonb))
  FROM public.pickup_displays d JOIN public.outlets o ON d.outlet_id = o.id
    JOIN public.tenants t ON t.id = o.tenant_id
  WHERE d.display_key = p_key AND o.status = 'active' AND t.status = 'active';
$$;
REVOKE ALL ON FUNCTION public.pickup_queue(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pickup_queue(uuid) TO anon, authenticated;
