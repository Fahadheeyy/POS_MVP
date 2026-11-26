-- Record the selected payment method directly at checkout.
CREATE OR REPLACE FUNCTION public.pos_checkout(p_request jsonb, p_outlet uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
<<checkout>>
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  tenant uuid := (session->>'tenantId')::uuid;
  actor uuid := (session->>'id')::uuid;
  sale uuid := (p_request->>'id')::uuid;
  ticket_id uuid := gen_random_uuid();
  settings jsonb;
  order_payload jsonb;
  previous_request jsonb;
  receipt_settings jsonb;
  ticket_payload jsonb;
  item_payload jsonb;
  ticket_item_payload jsonb;
  items jsonb := '[]';
  ticket_items jsonb := '[]';
  line jsonb;
  selected jsonb;
  modifier jsonb;
  product public.products%ROWTYPE;
  product_key text;
  addon_id uuid;
  item_id uuid;
  quantity integer;
  unit_price numeric;
  subtotal numeric := 0;
  line_total numeric;
  discount numeric := 0;
  discount_percent numeric := coalesce((p_request->>'discountPercent')::numeric, 0);
  cgst numeric := 0;
  line_discount numeric;
  taxable numeric;
  rate numeric;
  total numeric;
  adjustment numeric;
  mode text := p_request->>'paymentMode';
  reference text := nullif(btrim(p_request->>'paymentReference'), '');
  cash numeric := (p_request->>'cashTendered')::numeric;
  order_type text := p_request->>'orderType';
  table_number text := nullif(btrim(p_request->>'tableNumber'), '');
  customer text := coalesce(nullif(btrim(p_request->>'customerName'), ''), 'Guest');
  local_day date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  start_year integer := extract(year from local_day) - (extract(month from local_day) < 4)::integer;
  fy text := start_year || '-' || right((start_year + 1)::text, 2);
  number text;
  invoice text;
  pos_state text;
BEGIN
  IF outlet IS NULL OR NOT (session->'effectivePermissions' ?& ARRAY['pos.access','orders.create','payments.manage']) THEN
    RAISE EXCEPTION 'Checkout permission required' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.outlets WHERE id = outlet FOR UPDATE;
  SELECT o.pos_snapshot, o.pos_request INTO order_payload, previous_request FROM public.orders o
    WHERE o.id = sale AND o.outlet_id = outlet AND o.created_by = actor;
  IF order_payload IS NOT NULL THEN
    IF previous_request IS DISTINCT FROM p_request THEN
      RAISE EXCEPTION 'This checkout already succeeded. Review the recorded order before starting another sale.';
    END IF;
    RETURN order_payload;
  END IF;
  IF sale IS NULL OR mode IS NULL OR mode NOT IN ('cash', 'upi', 'card')
    OR order_type IS NULL OR order_type NOT IN ('dine_in', 'takeaway', 'delivery')
    OR (order_type = 'dine_in' AND table_number IS NULL)
    OR jsonb_typeof(p_request->'items') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_request->'items') NOT BETWEEN 1 AND 100
    OR discount_percent NOT BETWEEN 0 AND 100 OR length(customer) > 200 OR length(table_number) > 40 THEN
    RAISE EXCEPTION 'Invalid checkout request';
  END IF;
  IF discount_percent > 0 AND NOT (session->'effectivePermissions' ? 'settings.manage') THEN
    RAISE EXCEPTION 'Discount permission required' USING ERRCODE = '42501';
  END IF;
  settings := public.pos_outlet_settings(outlet);
  receipt_settings := CASE WHEN coalesce((settings->>'showWifiOnReceipt')::boolean, false)
    THEN settings ELSE settings - 'wifiPassword' END;
  IF settings->'enabledPayments' IS NOT NULL AND NOT coalesce((settings->'enabledPayments'->>mode)::boolean, false) THEN
    RAISE EXCEPTION 'This payment method is disabled';
  END IF;
  rate := CASE WHEN (settings->>'isGstEnabled')::boolean THEN (settings->>'gstRate')::numeric ELSE 0 END;
  pos_state := settings->>'stateCode';
  IF rate > 0 AND pos_state IS NULL THEN RAISE EXCEPTION 'Configure the outlet state before issuing invoices'; END IF;
  invoice := public.generate_next_invoice_number(outlet, fy, 'INV/' || right(start_year::text, 2) || '/');
  number := 'Token #' || regexp_replace(split_part(invoice, '/', 3), '^0+', '');

  INSERT INTO public.orders(id, tenant_id, outlet_id, order_number, order_type, status, customer_name, created_by)
  VALUES (sale, tenant, outlet, number, order_type, 'preparing', customer, actor);
  INSERT INTO public.kds_tickets(id, order_id, tenant_id, outlet_id, ticket_number)
  VALUES (ticket_id, sale, tenant, outlet, number);

  FOR line IN SELECT value FROM jsonb_array_elements(p_request->'items') LOOP
    quantity := (line->>'quantity')::integer;
    IF quantity IS NULL OR quantity NOT BETWEEN 1 AND 1000 OR length(line->>'notes') > 500 THEN
      RAISE EXCEPTION 'Invalid item quantity or note';
    END IF;
    product_key := line->>'productId';
    IF left(product_key, 6) = 'addon_' THEN
      product := NULL;
      SELECT m.name, m.price_delta, m.pos_image INTO product.name, product.price, product.image_url
      FROM public.modifier_options m JOIN public.modifier_groups g ON g.id = m.group_id
      WHERE m.id = substring(product_key from 7)::uuid AND m.is_active AND g.is_active
        AND g.tenant_id = tenant AND (g.outlet_id IS NULL OR g.outlet_id = outlet) FOR SHARE OF m;
      product.pos_station := 'Cold';
      product.hsn_sac_code := '996331';
    ELSE
      SELECT * INTO product FROM public.products p
        WHERE p.id = product_key::uuid AND p.tenant_id = tenant
          AND (p.outlet_id IS NULL OR p.outlet_id = outlet) AND p.is_active FOR SHARE;
    END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'An item is no longer available'; END IF;
    IF jsonb_typeof(line->'addOns') IS DISTINCT FROM 'array' OR jsonb_array_length(line->'addOns') > 30 THEN
      RAISE EXCEPTION 'Invalid modifiers';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.product_modifier_groups j
      JOIN public.modifier_groups g ON g.id = j.group_id AND g.is_active
      LEFT JOIN public.modifier_options m ON m.group_id = g.id AND m.is_active
        AND line->'addOns' ? m.id::text
      WHERE j.product_id = product.id
      GROUP BY g.id HAVING count(m.id) NOT BETWEEN g.min_selection AND g.max_selection
    ) THEN RAISE EXCEPTION 'Modifier selection does not match the menu'; END IF;
    selected := '[]';
    unit_price := product.price;
    item_id := gen_random_uuid();
    INSERT INTO public.order_items(id, order_id, product_id, name, quantity, unit_price, total_price, notes)
      VALUES (item_id, sale, product.id, product.name, quantity, unit_price, unit_price * quantity, line->>'notes');
    FOR addon_id IN SELECT DISTINCT value::uuid FROM jsonb_array_elements_text(line->'addOns') LOOP
      SELECT jsonb_build_object('groupId', g.id, 'groupName', g.name, 'item',
        jsonb_build_object('id', m.id, 'name', m.name, 'price', m.price_delta))
      INTO modifier FROM public.modifier_options m
      JOIN public.modifier_groups g ON g.id = m.group_id AND g.is_active
      JOIN public.product_modifier_groups j ON j.group_id = g.id AND j.product_id = product.id
      WHERE m.id = addon_id AND m.is_active
        AND g.tenant_id = tenant AND (g.outlet_id IS NULL OR g.outlet_id = outlet);
      IF NOT FOUND THEN RAISE EXCEPTION 'A modifier is no longer available'; END IF;
      unit_price := unit_price + (modifier->'item'->>'price')::numeric;
      selected := selected || jsonb_build_array(modifier);
      INSERT INTO public.order_item_modifiers(order_item_id, modifier_option_id, name, price_delta)
        VALUES (item_id, addon_id, modifier->'item'->>'name', (modifier->'item'->>'price')::numeric);
    END LOOP;
    line_total := unit_price * quantity;
    subtotal := subtotal + line_total;
    UPDATE public.order_items SET unit_price = checkout.unit_price, total_price = line_total WHERE id = item_id;
    item_payload := jsonb_build_object(
      'cartItemId', item_id, 'quantity', quantity, 'selectedAddOns', selected,
      'unitPrice', unit_price, 'lineTotal', line_total, 'specialInstructions', line->>'notes',
      'product', jsonb_build_object('id', product_key, 'name', product.name, 'categoryId', coalesce(product.category_id::text, 'addons'),
        'price', product.price, 'image', product.image_url, 'station', product.pos_station,
        'description', coalesce(product.description, ''), 'hsnCode', product.hsn_sac_code)
    );
    items := items || jsonb_build_array(item_payload);
    ticket_item_payload := jsonb_build_object(
      'id', item_id, 'productId', product_key, 'name', product.name,
      'quantity', quantity, 'station', product.pos_station, 'isReady', false,
      'modifiers', coalesce((SELECT jsonb_agg('+' || (m->'item'->>'name')) FROM jsonb_array_elements(selected) m), '[]')
        || CASE WHEN nullif(btrim(line->>'notes'), '') IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(line->>'notes') END
    );
    ticket_items := ticket_items || jsonb_build_array(ticket_item_payload);
    INSERT INTO public.kds_ticket_items(id, ticket_id, order_item_id) VALUES (item_id, ticket_id, item_id);
  END LOOP;

  FOR line IN SELECT value FROM jsonb_array_elements(items) LOOP
    line_total := (line->>'lineTotal')::numeric;
    line_discount := CASE WHEN subtotal = 0 THEN 0 ELSE round(line_total / subtotal * round(subtotal * discount_percent / 100, 2), 2) END;
    discount := discount + line_discount;
    cgst := cgst + round(greatest(0, line_total - line_discount) * rate / 200, 2);
  END LOOP;
  taxable := subtotal - discount;
  total := taxable + cgst * 2;
  adjustment := CASE WHEN (settings->>'isGstEnabled')::boolean AND settings->>'roundingStrategy' <> 'none'
    THEN round(total) - total ELSE 0 END;
  total := total + adjustment;
  IF total IS DISTINCT FROM (p_request->>'expectedTotal')::numeric THEN
    RAISE EXCEPTION 'Menu prices or taxes changed. Review the cart and try again.';
  END IF;
  IF mode = 'cash' AND (cash IS NULL OR cash < total OR cash > 100000000) THEN
    RAISE EXCEPTION 'Cash tendered must cover the full amount';
  END IF;
  IF length(reference) > 80 THEN
    RAISE EXCEPTION 'Payment reference must be 80 characters or fewer';
  END IF;

  order_payload := jsonb_build_object(
    'id', sale, 'orderNumber', number, 'type', replace(order_type, '_', '-'),
    'items', items, 'customerName', customer, 'guestCount', least(100, greatest(1, coalesce((p_request->>'guestCount')::integer, 1))),
    'tableNumber', CASE WHEN order_type = 'dine_in' THEN table_number END,
    'subtotal', subtotal, 'discount', discount, 'discountPercent', discount_percent,
    'cgst', cgst, 'sgst', cgst, 'tax', cgst * 2, 'total', total, 'roundingAdjustment', adjustment,
    'paymentMode', mode, 'paymentStatus', 'paid', 'paymentReference', reference, 'cashTendered', cash,
    'cashChange', CASE WHEN mode = 'cash' THEN cash - total END,
    'cashierId', actor, 'cashierName', session->>'name', 'createdAt', now(), 'status', 'preparing',
    'invoiceNumber', invoice, 'receiptSettings', receipt_settings, 'posStateCode', pos_state, 'gstRate', rate
  );
  ticket_payload := jsonb_build_object(
    'id', ticket_id, 'orderId', sale, 'orderNumber', number, 'orderType', replace(order_type, '_', '-'),
    'customerName', customer, 'guestCount', order_payload->'guestCount', 'tableNumber', order_payload->'tableNumber',
    'channel', CASE WHEN order_type = 'dine_in' THEN 'Table Service' ELSE 'Counter Express' END,
    'targetMinutes', (settings->>'kdsTargetMinutes')::integer, 'createdAt', now(),
    'status', 'new', 'isRush', false, 'items', ticket_items
  );
  UPDATE public.orders SET subtotal = checkout.subtotal, discount_total = discount,
    tax_total = cgst * 2, rounding_adjustment = adjustment, grand_total = total, item_count = jsonb_array_length(items),
    pos_snapshot = order_payload, pos_request = p_request WHERE id = sale;
  UPDATE public.kds_tickets SET pos_snapshot = ticket_payload WHERE id = ticket_id;
  IF total > 0 THEN
    INSERT INTO public.payments(order_id, tenant_id, outlet_id, payment_method, amount, reference_number, collected_by,
      metadata)
    VALUES (sale, tenant, outlet, mode, total, reference, actor, jsonb_build_object('recording_method',
      CASE WHEN mode = 'cash' THEN 'cash_tendered' ELSE 'cashier_recorded' END));
  END IF;
  IF (settings->>'isGstEnabled')::boolean THEN
    INSERT INTO public.invoices(tenant_id, outlet_id, order_id, invoice_number, financial_year,
      place_of_supply_state_code, customer_name, taxable_value, cgst_rate, cgst_amount,
      sgst_rate, sgst_amount, discount_amount, rounding_adjustment, grand_total, immutable_payload_snapshot)
    VALUES (tenant, outlet, sale, invoice, fy, pos_state, customer, taxable, rate / 2, cgst,
      rate / 2, cgst, discount, adjustment, total, order_payload);
  END IF;

  RETURN order_payload;
END;
$$;
