CREATE FUNCTION public.update_pos_preferences(p_settings jsonb, p_outlet uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  current_settings jsonb;
  editable jsonb;
  tax_keys text[] := ARRAY['gstRate', 'gstin', 'isGstEnabled', 'roundingStrategy', 'stateCode'];
  tax_key text;
  selected_state_id uuid;
  state_code text;
BEGIN
  IF outlet IS NULL OR NOT (session->'effectivePermissions' ? 'settings.manage') THEN
    RAISE EXCEPTION 'Outlet settings permission required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_settings) IS DISTINCT FROM 'object' OR length(p_settings::text) > 24000 THEN
    RAISE EXCEPTION 'Invalid outlet settings';
  END IF;

  PERFORM 1 FROM public.outlets WHERE id = outlet FOR UPDATE;
  current_settings := public.pos_outlet_settings(outlet);
  FOREACH tax_key IN ARRAY tax_keys LOOP
    IF p_settings ? tax_key AND p_settings->tax_key IS DISTINCT FROM current_settings->tax_key
      AND NOT (session->'effectivePermissions' ? 'tax.manage') THEN
      RAISE EXCEPTION 'Tax configuration permission required' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  SELECT coalesce(jsonb_object_agg(k, v), '{}') INTO editable
  FROM jsonb_each(p_settings) AS fields(k, v)
  WHERE k = ANY(ARRAY[
    'storeName', 'brandTagline', 'address', 'phone', 'email', 'gstin', 'fssai', 'gstRate',
    'isGstEnabled', 'roundingStrategy', 'receiptHeader', 'receiptFooter', 'wifiPassword',
    'showWifiOnReceipt', 'showGstinOnReceipt', 'autoPrintReceipt', 'upiVpaId', 'printerModel',
    'cashTiming', 'defaultPaymentMode', 'enabledPayments', 'kdsTargetMinutes', 'soundAlertsEnabled',
    'isSetupCompleted', 'stateCode'
  ]);
  current_settings := current_settings || editable;
  state_code := current_settings->>'stateCode';
  IF state_code IS NOT NULL THEN
    SELECT s.id INTO selected_state_id FROM public.states s WHERE s.code = state_code AND s.is_active;
    IF selected_state_id IS NULL THEN RAISE EXCEPTION 'Choose a valid outlet state'; END IF;
  END IF;
  IF coalesce((current_settings->>'isGstEnabled')::boolean, false) AND (
    selected_state_id IS NULL OR coalesce(current_settings->>'gstin', '') !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'
    OR left(current_settings->>'gstin', 2) <> state_code
    OR (current_settings->>'gstRate')::numeric NOT BETWEEN 0 AND 100
  ) THEN RAISE EXCEPTION 'GST registration, tax rate, and outlet state must agree'; END IF;
  IF editable ? 'storeName' AND length(btrim(coalesce(editable->>'storeName', ''))) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'Enter an outlet name';
  END IF;
  IF editable ? 'cashTiming' AND editable->>'cashTiming' NOT IN ('before', 'after') THEN
    RAISE EXCEPTION 'Choose when cash is collected';
  END IF;
  IF editable ? 'roundingStrategy' AND editable->>'roundingStrategy' NOT IN ('none', 'round_half_up') THEN
    RAISE EXCEPTION 'Choose a supported rounding strategy';
  END IF;
  IF editable ? 'kdsTargetMinutes' AND (editable->>'kdsTargetMinutes')::integer NOT BETWEEN 1 AND 180 THEN
    RAISE EXCEPTION 'Kitchen target must be between 1 and 180 minutes';
  END IF;
  INSERT INTO public.pos_preferences(outlet_id, settings) VALUES (outlet, editable)
  ON CONFLICT (outlet_id) DO UPDATE SET settings = public.pos_preferences.settings || excluded.settings;
  UPDATE public.outlets AS o SET name = coalesce(editable->>'storeName', o.name),
    state_id = coalesce(selected_state_id, o.state_id), updated_at = now() WHERE o.id = outlet;
END;
$$;
REVOKE ALL ON FUNCTION public.update_pos_preferences(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_pos_preferences(jsonb, uuid) TO authenticated;
