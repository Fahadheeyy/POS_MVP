-- Send the requested readiness so retries and two screens showing the same state agree.
CREATE FUNCTION public.pos_set_ticket_item_ready(p_ticket uuid, p_item uuid, p_ready boolean, p_outlet uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  current_ready boolean;
BEGIN
  IF p_outlet IS NULL OR (session->>'outletId')::uuid IS DISTINCT FROM p_outlet
    OR NOT coalesce(session->'effectivePermissions' ? 'kds.access', false) THEN
    RAISE EXCEPTION 'Kitchen access required' USING ERRCODE = '42501';
  END IF;
  IF p_ready IS NULL THEN RAISE EXCEPTION 'Choose an item state'; END IF;

  PERFORM 1 FROM public.outlets WHERE id = p_outlet FOR UPDATE;
  SELECT i.status = 'ready' INTO current_ready
  FROM public.kds_ticket_items i
  JOIN public.kds_tickets t ON t.id = i.ticket_id
  WHERE i.id = p_item AND t.id = p_ticket AND t.outlet_id = p_outlet
    AND t.status NOT IN ('cancelled', 'delivered') AND t.pos_snapshot IS NOT NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket item is no longer active'; END IF;
  IF current_ready IS DISTINCT FROM p_ready THEN
    PERFORM public.pos_ticket(p_ticket, 'item', p_item::text, p_outlet);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.pos_set_ticket_item_ready(uuid, uuid, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_set_ticket_item_ready(uuid, uuid, boolean, uuid) TO authenticated;
