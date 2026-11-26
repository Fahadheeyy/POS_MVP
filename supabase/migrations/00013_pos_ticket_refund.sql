CREATE FUNCTION public.pos_ticket(p_ticket uuid, p_action text, p_value text DEFAULT NULL, p_outlet uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  ticket public.kds_tickets%ROWTYPE;
  items jsonb;
  target text;
  order_status text;
  ticket_status text;
  ready boolean;
BEGIN
  IF outlet IS NULL OR NOT (session->'effectivePermissions' ? 'kds.access') THEN
    RAISE EXCEPTION 'Kitchen access required' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.outlets WHERE id = outlet FOR UPDATE;
  SELECT * INTO ticket FROM public.kds_tickets k WHERE k.id = p_ticket AND k.outlet_id = outlet FOR UPDATE;
  IF ticket.id IS NULL OR ticket.pos_snapshot IS NULL OR ticket.status = 'cancelled' THEN
    RAISE EXCEPTION 'Ticket is no longer active';
  END IF;
  target := ticket.pos_snapshot->>'status';
  items := ticket.pos_snapshot->'items';
  CASE p_action
    WHEN 'advance' THEN
      IF p_value IS NOT NULL AND p_value <> target THEN RETURN; END IF;
      target := CASE target WHEN 'new' THEN 'cooking' WHEN 'cooking' THEN 'ready' WHEN 'ready' THEN 'bumped' ELSE target END;
    WHEN 'status' THEN
      IF p_value IS NULL OR p_value NOT IN ('new','cooking','ready','bumped') THEN RAISE EXCEPTION 'Invalid ticket status'; END IF;
      target := p_value;
    WHEN 'recall' THEN
      IF target = 'bumped' THEN target := 'ready'; END IF;
    WHEN 'item' THEN
      IF target = 'bumped' THEN RAISE EXCEPTION 'Recall the ticket before editing items'; END IF;
      UPDATE public.kds_ticket_items SET status = CASE status WHEN 'ready' THEN 'cooking' ELSE 'ready' END
        WHERE id = p_value::uuid AND ticket_id = p_ticket RETURNING status = 'ready' INTO ready;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ticket item not found'; END IF;
      SELECT jsonb_agg(CASE WHEN item->>'id' = p_value THEN item || jsonb_build_object('isReady', ready) ELSE item END ORDER BY ord)
        INTO items FROM jsonb_array_elements(items) WITH ORDINALITY AS i(item, ord);
      IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(items) i WHERE NOT (i->>'isReady')::boolean) THEN
        target := 'ready';
      ELSIF target = 'ready' THEN
        target := 'cooking';
      END IF;
    WHEN 'rush' THEN
      UPDATE public.kds_tickets SET priority = CASE WHEN p_value::boolean THEN 'urgent' ELSE 'normal' END,
        pos_snapshot = pos_snapshot || jsonb_build_object('isRush', p_value::boolean) WHERE id = p_ticket;
      RETURN;
    WHEN 'note' THEN
      UPDATE public.kds_tickets SET pos_snapshot = pos_snapshot || jsonb_build_object('prepNote', left(p_value, 500))
        WHERE id = p_ticket;
      RETURN;
    ELSE RAISE EXCEPTION 'Unknown ticket action';
  END CASE;
  IF target IN ('ready', 'bumped') THEN
    SELECT jsonb_agg(item || '{"isReady":true}'::jsonb ORDER BY ord)
      INTO items FROM jsonb_array_elements(items) WITH ORDINALITY AS i(item, ord);
    UPDATE public.kds_ticket_items SET status = CASE WHEN target = 'bumped' THEN 'delivered' ELSE 'ready' END
      WHERE ticket_id = p_ticket;
  ELSIF target = 'new' THEN
    SELECT jsonb_agg(item || '{"isReady":false}'::jsonb ORDER BY ord)
      INTO items FROM jsonb_array_elements(items) WITH ORDINALITY AS i(item, ord);
    UPDATE public.kds_ticket_items SET status = 'pending' WHERE ticket_id = p_ticket;
  END IF;
  ticket_status := CASE target WHEN 'new' THEN 'pending' WHEN 'cooking' THEN 'preparing' WHEN 'ready' THEN 'ready' ELSE 'delivered' END;
  order_status := CASE target WHEN 'bumped' THEN 'completed' WHEN 'ready' THEN 'ready' ELSE 'preparing' END;
  UPDATE public.kds_tickets SET status = ticket_status,
    pos_snapshot = pos_snapshot || jsonb_build_object('status', target, 'items', items,
      'readyAt', CASE WHEN target IN ('ready', 'bumped') THEN coalesce(nullif(pos_snapshot->'readyAt', 'null'::jsonb), to_jsonb(now())) END,
      'cookingStartedAt', CASE WHEN target <> 'new' THEN coalesce(nullif(pos_snapshot->'cookingStartedAt', 'null'::jsonb), to_jsonb(now())) END,
      'bumpedAt', CASE WHEN target = 'bumped' THEN now() END),
    completed_at = CASE WHEN target = 'bumped' THEN now() END, updated_at = now() WHERE id = p_ticket;
  UPDATE public.orders SET status = order_status,
    completed_at = CASE WHEN target = 'bumped' THEN now() END, updated_at = now(),
    pos_snapshot = pos_snapshot || jsonb_build_object('status', order_status, 'completedAt', CASE WHEN target = 'bumped' THEN now() END)
    WHERE id = ticket.order_id AND status NOT IN ('refunded', 'cancelled');
END;
$$;

CREATE FUNCTION public.pos_refund(p_order uuid, p_reason text, p_reference text, p_outlet uuid, p_cancel_ticket boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  actor uuid := (session->>'id')::uuid;
  sale public.orders%ROWTYPE;
  sh public.pos_shifts%ROWTYPE;
  invoice public.invoices%ROWTYPE;
  local_day date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  start_year integer := extract(year from local_day) - (extract(month from local_day) < 4)::integer;
  fy text := start_year || '-' || right((start_year + 1)::text, 2);
  credit_number text;
  mode text;
BEGIN
  IF outlet IS NULL OR outlet IS DISTINCT FROM p_outlet OR NOT (session->'effectivePermissions' ? 'orders.refund') THEN
    RAISE EXCEPTION 'Refund approval requires a supervisor assigned to this outlet' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_reason, ''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Enter a refund reason'; END IF;
  PERFORM 1 FROM public.outlets WHERE id = outlet FOR UPDATE;
  SELECT * INTO sale FROM public.orders o WHERE o.id = p_order AND o.outlet_id = outlet FOR UPDATE;
  IF sale.id IS NULL OR sale.pos_snapshot IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF sale.status = 'refunded' THEN RETURN; END IF;
  IF sale.pos_snapshot->>'paymentStatus' <> 'paid' THEN RAISE EXCEPTION 'An unpaid order cannot be refunded'; END IF;
  IF p_cancel_ticket AND sale.status IN ('completed', 'cancelled') THEN RAISE EXCEPTION 'Ticket is no longer active'; END IF;
  mode := sale.pos_snapshot->>'paymentMode';
  IF sale.grand_total > 0 AND mode <> 'cash' AND length(btrim(coalesce(p_reference, ''))) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'Enter the refund reference from the payment provider or terminal';
  END IF;
  SELECT * INTO sh FROM public.pos_shifts WHERE outlet_id = outlet AND closed_at IS NULL FOR UPDATE;
  IF sh.id IS NULL THEN RAISE EXCEPTION 'Open a shift before recording a refund'; END IF;

  SELECT * INTO invoice FROM public.invoices WHERE order_id = sale.id;
  IF invoice.id IS NOT NULL THEN
    credit_number := public.generate_next_invoice_number(outlet, fy, 'CN/' || right(start_year::text, 2) || '/');
    INSERT INTO public.credit_notes(tenant_id, outlet_id, invoice_id, credit_note_number, financial_year,
      reason, amount, cgst_amount, sgst_amount, igst_amount)
    VALUES (sale.tenant_id, outlet, invoice.id, credit_number, fy,
      btrim(p_reason), sale.grand_total, invoice.cgst_amount, invoice.sgst_amount, invoice.igst_amount);
  END IF;
  UPDATE public.orders SET status = 'refunded', cancelled_at = now(), cancellation_reason = btrim(p_reason),
    updated_at = now(), pos_snapshot = pos_snapshot || jsonb_build_object(
      'status', 'cancelled', 'paymentStatus', 'refunded', 'creditNoteNumber', credit_number,
      'cancelReason', btrim(p_reason), 'refundedAt', now())
    WHERE id = sale.id;
  UPDATE public.kds_tickets SET status = 'cancelled', updated_at = now() WHERE order_id = sale.id;
  UPDATE public.payments SET status = 'refunded', metadata = coalesce(metadata, '{}') || jsonb_build_object(
    'refundReference', nullif(btrim(p_reference), ''), 'refundApprovedBy', actor, 'refundRecordedAt', now())
    WHERE order_id = sale.id AND status = 'success';
  UPDATE public.pos_shifts SET snapshot = snapshot || jsonb_build_object(
    'refunds', (snapshot->>'refunds')::numeric + sale.grand_total,
    'cashRefunds', (snapshot->>'cashRefunds')::numeric + CASE WHEN mode = 'cash' THEN sale.grand_total ELSE 0 END,
    'grossSales', (snapshot->>'grossSales')::numeric - sale.grand_total
  ) WHERE id = sh.id;
  INSERT INTO public.audit_logs(tenant_id, outlet_id, actor_profile_id, action, entity_type, entity_id, metadata)
  VALUES (sale.tenant_id, outlet, actor, 'order.refunded', 'order', sale.id::text,
    jsonb_build_object('amount', sale.grand_total, 'reason', btrim(p_reason), 'creditNote', credit_number));
END;
$$;

REVOKE ALL ON FUNCTION public.pos_ticket(uuid, text, text, uuid), public.pos_refund(uuid, text, text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_ticket(uuid, text, text, uuid), public.pos_refund(uuid, text, text, uuid, boolean) TO authenticated;

-- Keep the sequence unique when a prefix is selected for a credit note.
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(p_outlet_id uuid, p_financial_year text, p_prefix text DEFAULT 'INV/')
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  sequence bigint;
BEGIN
  INSERT INTO public.invoice_sequences(outlet_id, financial_year, prefix, next_number)
  VALUES (p_outlet_id, p_financial_year, p_prefix, 2)
  ON CONFLICT (outlet_id, financial_year)
  DO UPDATE SET next_number = public.invoice_sequences.next_number + 1, updated_at = now()
  RETURNING next_number - 1 INTO sequence;
  IF length(p_prefix || sequence::text) > 16 THEN RAISE EXCEPTION 'Invoice sequence exhausted'; END IF;
  RETURN p_prefix || lpad(sequence::text, greatest(6, length(sequence::text)), '0');
END;
$$;
