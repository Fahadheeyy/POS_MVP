-- Platform Super Admin Workspace RPCs, Outlet Switcher Support, and Full Outlet Lifecycle Controls

-- 1. Allow verified Platform Super Admins to inspect/operate selected active outlets via get_pos_session and get_pos_outlets.
CREATE OR REPLACE FUNCTION public.get_pos_session(p_outlet uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
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
  INTO v_result
  FROM public.profiles p
  JOIN public.outlet_memberships m ON m.profile_id = p.id AND m.status = 'active'
  JOIN public.outlets o ON o.id = m.outlet_id AND o.status = 'active'
  JOIN public.tenants t ON t.id = o.tenant_id AND t.status = 'active'
  JOIN public.roles r ON r.id = m.role_id
  LEFT JOIN public.states s ON s.id = o.state_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active
    AND (p_outlet IS NULL OR o.id = p_outlet)
  ORDER BY m.is_primary DESC, m.created_at, m.id
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  IF public.is_platform_super_admin() THEN
    SELECT jsonb_build_object(
      'id', coalesce(p.id, pa.id),
      'email', pa.email,
      'name', pa.name,
      'phone', coalesce(p.phone, ''),
      'avatarInitials', coalesce(p.avatar_initials, upper(left(pa.name, 2))),
      'title', 'Platform Super Admin',
      'active', true,
      'role', 'owner',
      'pin', '',
      'outletId', o.id,
      'tenantId', t.id,
      'stateCode', s.code,
      'outletName', o.name,
      'effectivePermissions', coalesce((
        SELECT jsonb_agg(perm.code) FROM public.permissions perm
      ), '[]'::jsonb)
    )
    INTO v_result
    FROM public.platform_admins pa
    LEFT JOIN public.profiles p ON p.auth_user_id = auth.uid()
    JOIN public.outlets o ON (p_outlet IS NULL OR o.id = p_outlet) AND o.status = 'active'
    JOIN public.tenants t ON t.id = o.tenant_id AND t.status <> 'archived'
    LEFT JOIN public.states s ON s.id = o.state_id
    WHERE pa.user_id = auth.uid() AND pa.status = 'active' AND pa.is_super_admin
    ORDER BY o.is_default DESC, o.created_at, o.id
    LIMIT 1;
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pos_outlets()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name) ORDER BY o.name), '[]')
  FROM public.outlets o
  JOIN public.tenants t ON t.id = o.tenant_id
  WHERE o.status = 'active' AND t.status <> 'archived'
    AND (
      public.is_platform_super_admin()
      OR o.id IN (SELECT outlet_id FROM public.get_user_outlet_ids())
    )
$$;

-- 2. Full Platform Admin Workspace Read RPC
CREATE FUNCTION public.get_platform_admin_workspace()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_businesses jsonb;
  v_stats jsonb;
  v_states jsonb;
  v_plans jsonb;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(row_data ORDER BY tenant_created_at, outlet_created_at), '[]'::jsonb)
  INTO v_businesses
  FROM (
    SELECT
      t.created_at AS tenant_created_at,
      o.created_at AS outlet_created_at,
      jsonb_build_object(
        'id', o.id,
        'tenantId', t.id,
        'name', o.name,
        'brandName', t.brand_name,
        'slug', CASE WHEN o.is_default THEN t.slug ELSE t.slug || '-' || lower(o.code) END,
        'code', o.code,
        'tagline', coalesce(b.tagline, ''),
        'category', coalesce(t.category, 'QSR'),
        'address', o.address_line1,
        'city', o.city,
        'pincode', o.pincode,
        'phone', o.phone,
        'email', o.email,
        'stateCode', coalesce(s.code, '29'),
        'stateName', coalesce(s.name, 'Karnataka'),
        'gstin', coalesce(g.gstin, ''),
        'fssai', coalesce(b.fssai_number, ''),
        'legalEntityName', coalesce(g.legal_name, t.legal_name, t.brand_name),
        'currency', coalesce(b.currency, 'INR'),
        'currencySymbol', coalesce(b.currency_symbol, '₹'),
        'planTier', CASE
          WHEN ts.status = 'trialing' THEN 'trial'
          WHEN sp.code IN ('starter', 'growth', 'enterprise') THEN sp.code
          ELSE 'starter'
        END,
        'status', CASE WHEN o.status = 'active' THEN 'active' ELSE 'inactive' END,
        'outletStatus', o.status,
        'tenantStatus', t.status,
        'renewalDate', to_char(coalesce(ts.current_period_end, now() + interval '365 days'), 'YYYY-MM-DD'),
        'themeColor', coalesce(pref.settings->>'themeColor', t.metadata->>'themeColor', '#FF4F1A'),
        'ownerProfileId', owner_prof.id,
        'ownerName', coalesce(owner_prof.name, t.brand_name || ' Owner'),
        'ownerEmail', coalesce(owner_prof.email, o.email),
        'ownerPhone', coalesce(owner_prof.phone, o.phone),
        'ownerPin', coalesce(pref.settings->>'ownerPinDisplay', '8888'),
        'tableCount', (SELECT count(*) FROM public.dining_tables dt WHERE dt.outlet_id = o.id),
        'kdsTargetMinutes', coalesce((pref.settings->>'kdsTargetMinutes')::integer, 7),
        'serviceChargePercent', coalesce(b.service_charge_percent, 0),
        'isCompositionScheme', coalesce(g.composition_scheme, false),
        'upiVpaId', coalesce(pref.settings->>'upiVpaId', ''),
        'orderCount', (SELECT count(*) FROM public.orders ord WHERE ord.outlet_id = o.id),
        'gmv', coalesce((SELECT sum(ord.grand_total) FROM public.orders ord WHERE ord.outlet_id = o.id AND ord.status <> 'cancelled'), 0),
        'features', jsonb_build_object(
          'kdsEnabled', coalesce((pref.settings->>'kdsEnabled')::boolean, true),
          'gstEnabled', coalesce((pref.settings->>'isGstEnabled')::boolean, g.gstin IS NOT NULL AND NOT coalesce(g.composition_scheme, false)),
          'gstRate', coalesce((pref.settings->>'gstRate')::numeric, 5),
          'addOnsEnabled', coalesce((pref.settings->>'addOnsEnabled')::boolean, true),
          'autoPrintReceipt', coalesce((pref.settings->>'autoPrintReceipt')::boolean, false),
          'cashTiming', coalesce(pref.settings->>'cashTiming', 'before'),
          'tableManagement', coalesce((pref.settings->>'tableManagement')::boolean, (SELECT count(*) FROM public.dining_tables dt WHERE dt.outlet_id = o.id) > 0),
          'receiptHeader', coalesce(pref.settings->>'receiptHeader', b.receipt_header, ''),
          'receiptFooter', coalesce(pref.settings->>'receiptFooter', b.receipt_footer, ''),
          'wifiPassword', coalesce(pref.settings->>'wifiPassword', ''),
          'loyaltyEnabled', true,
          'enabledPayments', coalesce(pref.settings->'enabledPayments', jsonb_build_object('cash', true, 'upi', true, 'card', true))
        )
      ) AS row_data
    FROM public.outlets o
    JOIN public.tenants t ON t.id = o.tenant_id
    LEFT JOIN public.states s ON s.id = o.state_id
    LEFT JOIN public.outlet_business_profiles b ON b.outlet_id = o.id
    LEFT JOIN public.outlet_gst_registrations g ON g.outlet_id = o.id
    LEFT JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
    LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
    LEFT JOIN public.pos_preferences pref ON pref.outlet_id = o.id
    LEFT JOIN LATERAL (
      SELECT p.id, p.name, p.email, p.phone
      FROM public.outlet_memberships om
      JOIN public.roles r ON r.id = om.role_id AND r.code = 'owner'
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.outlet_id = o.id AND om.status = 'active'
      ORDER BY om.created_at
      LIMIT 1
    ) owner_outlet ON true
    LEFT JOIN LATERAL (
      SELECT p.id, p.name, p.email, p.phone
      FROM public.tenant_memberships tm
      JOIN public.profiles p ON p.id = tm.profile_id
      WHERE tm.tenant_id = t.id AND tm.is_owner = true
      ORDER BY tm.created_at
      LIMIT 1
    ) owner_tenant ON true
    CROSS JOIN LATERAL (
      SELECT
        coalesce(owner_outlet.id, owner_tenant.id) AS id,
        coalesce(owner_outlet.name, owner_tenant.name) AS name,
        coalesce(owner_outlet.email, owner_tenant.email) AS email,
        coalesce(owner_outlet.phone, owner_tenant.phone) AS phone
    ) owner_prof
    WHERE o.status <> 'archived' AND t.status <> 'archived'
  ) sub;

  SELECT jsonb_build_object(
    'totalGmv', coalesce((SELECT sum(grand_total) FROM public.orders WHERE status <> 'cancelled'), 0),
    'totalOrders', (SELECT count(*) FROM public.orders),
    'totalTickets', (SELECT count(*) FROM public.kds_tickets WHERE status IN ('pending', 'preparing', 'ready')),
    'totalProducts', (SELECT count(*) FROM public.products WHERE is_active)
  ) INTO v_stats;

  SELECT coalesce(jsonb_agg(jsonb_build_object('code', code, 'name', name) ORDER BY name), '[]'::jsonb)
  INTO v_states FROM public.states WHERE is_active;

  SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name, 'priceMonthly', price_monthly) ORDER BY display_order), '[]'::jsonb)
  INTO v_plans FROM public.subscription_plans WHERE is_active;

  RETURN jsonb_build_object(
    'businesses', v_businesses,
    'stats', v_stats,
    'states', v_states,
    'plans', v_plans
  );
END;
$$;

-- 3. Update Outlet Configuration, Feature Flags & White-Labeling RPC
CREATE FUNCTION public.update_platform_outlet(p_outlet_id uuid, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_state_id uuid;
  v_plan_id uuid;
  v_plan_code text;
  v_sub_status text;
  v_features jsonb := coalesce(p_payload->'features', '{}'::jsonb);
  v_pref jsonb;
  v_target_tables integer;
  v_existing_tables integer;
  v_idx integer;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT tenant_id INTO STRICT v_tenant_id
  FROM public.outlets WHERE id = p_outlet_id FOR UPDATE;

  IF p_payload ? 'stateCode' THEN
    SELECT id INTO v_state_id FROM public.states WHERE code = p_payload->>'stateCode' AND is_active;
  END IF;

  UPDATE public.outlets SET
    name = coalesce(nullif(btrim(p_payload->>'name'), ''), name),
    address_line1 = coalesce(nullif(btrim(p_payload->>'address'), ''), address_line1),
    city = coalesce(nullif(btrim(p_payload->>'city'), ''), city),
    pincode = coalesce(nullif(btrim(p_payload->>'pincode'), ''), pincode),
    phone = coalesce(nullif(btrim(p_payload->>'phone'), ''), phone),
    email = coalesce(nullif(btrim(p_payload->>'email'), ''), email),
    state_id = coalesce(v_state_id, state_id),
    updated_at = now()
  WHERE id = p_outlet_id;

  UPDATE public.tenants SET
    brand_name = coalesce(nullif(btrim(p_payload->>'brandName'), ''), brand_name),
    category = coalesce(nullif(btrim(p_payload->>'category'), ''), category),
    legal_name = coalesce(nullif(btrim(p_payload->>'legalEntityName'), ''), legal_name),
    metadata = coalesce(metadata, '{}'::jsonb) || CASE WHEN p_payload ? 'themeColor' THEN jsonb_build_object('themeColor', p_payload->>'themeColor') ELSE '{}'::jsonb END,
    updated_at = now()
  WHERE id = v_tenant_id;

  IF p_payload ? 'planTier' THEN
    v_plan_code := CASE WHEN p_payload->>'planTier' = 'trial' THEN 'starter' ELSE p_payload->>'planTier' END;
    v_sub_status := CASE WHEN p_payload->>'planTier' = 'trial' THEN 'trialing' ELSE 'active' END;
    SELECT id INTO v_plan_id FROM public.subscription_plans WHERE code = v_plan_code AND is_active LIMIT 1;
    IF v_plan_id IS NOT NULL THEN
      INSERT INTO public.tenant_subscriptions (tenant_id, plan_id, status)
      VALUES (v_tenant_id, v_plan_id, v_sub_status)
      ON CONFLICT (tenant_id) DO UPDATE SET plan_id = excluded.plan_id, status = excluded.status, updated_at = now();
    END IF;
  END IF;

  INSERT INTO public.outlet_business_profiles (outlet_id, fssai_number, tagline, receipt_header, receipt_footer, service_charge_percent, service_charge_enabled)
  VALUES (
    p_outlet_id,
    nullif(btrim(p_payload->>'fssai'), ''),
    coalesce(p_payload->>'tagline', ''),
    coalesce(v_features->>'receiptHeader', ''),
    coalesce(v_features->>'receiptFooter', 'Thank you for visiting!'),
    coalesce((p_payload->>'serviceChargePercent')::numeric, 0),
    coalesce((p_payload->>'serviceChargePercent')::numeric, 0) > 0
  )
  ON CONFLICT (outlet_id) DO UPDATE SET
    fssai_number = coalesce(nullif(btrim(p_payload->>'fssai'), ''), outlet_business_profiles.fssai_number),
    tagline = coalesce(p_payload->>'tagline', outlet_business_profiles.tagline),
    receipt_header = coalesce(v_features->>'receiptHeader', outlet_business_profiles.receipt_header),
    receipt_footer = coalesce(v_features->>'receiptFooter', outlet_business_profiles.receipt_footer),
    service_charge_percent = coalesce((p_payload->>'serviceChargePercent')::numeric, outlet_business_profiles.service_charge_percent),
    service_charge_enabled = coalesce((p_payload->>'serviceChargePercent')::numeric, outlet_business_profiles.service_charge_percent) > 0,
    updated_at = now();

  IF nullif(btrim(coalesce(p_payload->>'gstin', '')), '') IS NOT NULL THEN
    INSERT INTO public.outlet_gst_registrations (outlet_id, gstin, trade_name, legal_name, composition_scheme, state_code, registered_address)
    SELECT
      p_outlet_id,
      upper(btrim(p_payload->>'gstin')),
      o.name,
      coalesce(nullif(btrim(p_payload->>'legalEntityName'), ''), t.brand_name),
      coalesce((p_payload->>'isCompositionScheme')::boolean, false),
      coalesce(p_payload->>'stateCode', '29'),
      o.address_line1 || ', ' || o.city
    FROM public.outlets o JOIN public.tenants t ON t.id = o.tenant_id WHERE o.id = p_outlet_id
    ON CONFLICT (outlet_id) DO UPDATE SET
      gstin = excluded.gstin,
      legal_name = excluded.legal_name,
      composition_scheme = excluded.composition_scheme,
      state_code = excluded.state_code,
      updated_at = now();
  END IF;

  SELECT coalesce(settings, '{}'::jsonb) INTO v_pref FROM public.pos_preferences WHERE outlet_id = p_outlet_id;
  v_pref := coalesce(v_pref, '{}'::jsonb)
    || CASE WHEN p_payload ? 'themeColor' THEN jsonb_build_object('themeColor', p_payload->>'themeColor') ELSE '{}'::jsonb END
    || CASE WHEN p_payload ? 'upiVpaId' THEN jsonb_build_object('upiVpaId', p_payload->>'upiVpaId') ELSE '{}'::jsonb END
    || CASE WHEN p_payload ? 'kdsTargetMinutes' THEN jsonb_build_object('kdsTargetMinutes', (p_payload->>'kdsTargetMinutes')::integer) ELSE '{}'::jsonb END
    || CASE WHEN p_payload ? 'ownerPin' THEN jsonb_build_object('ownerPinDisplay', p_payload->>'ownerPin') ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'kdsEnabled' THEN jsonb_build_object('kdsEnabled', (v_features->>'kdsEnabled')::boolean) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'gstEnabled' THEN jsonb_build_object('isGstEnabled', (v_features->>'gstEnabled')::boolean) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'gstRate' THEN jsonb_build_object('gstRate', (v_features->>'gstRate')::numeric) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'addOnsEnabled' THEN jsonb_build_object('addOnsEnabled', (v_features->>'addOnsEnabled')::boolean) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'autoPrintReceipt' THEN jsonb_build_object('autoPrintReceipt', (v_features->>'autoPrintReceipt')::boolean) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'cashTiming' THEN jsonb_build_object('cashTiming', v_features->>'cashTiming') ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'tableManagement' THEN jsonb_build_object('tableManagement', (v_features->>'tableManagement')::boolean) ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'receiptHeader' THEN jsonb_build_object('receiptHeader', v_features->>'receiptHeader') ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'receiptFooter' THEN jsonb_build_object('receiptFooter', v_features->>'receiptFooter') ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'wifiPassword' THEN jsonb_build_object('wifiPassword', v_features->>'wifiPassword') ELSE '{}'::jsonb END
    || CASE WHEN v_features ? 'enabledPayments' THEN jsonb_build_object('enabledPayments', v_features->'enabledPayments') ELSE '{}'::jsonb END;

  INSERT INTO public.pos_preferences (outlet_id, settings)
  VALUES (p_outlet_id, v_pref)
  ON CONFLICT (outlet_id) DO UPDATE SET settings = excluded.settings;

  IF p_payload ? 'tableCount' THEN
    v_target_tables := least(100, greatest(0, (p_payload->>'tableCount')::integer));
    SELECT count(*) INTO v_existing_tables FROM public.dining_tables WHERE outlet_id = p_outlet_id;
    IF v_target_tables > v_existing_tables THEN
      FOR v_idx IN (v_existing_tables + 1)..v_target_tables LOOP
        INSERT INTO public.dining_tables (tenant_id, outlet_id, name, section, capacity, status)
        VALUES (v_tenant_id, p_outlet_id, 'T-' || lpad(v_idx::text, 2, '0'), 'Main Dining', 4, 'vacant')
        ON CONFLICT (outlet_id, name) DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (tenant_id, outlet_id, actor_profile_id, action, entity_type, entity_id, new_values, metadata)
  VALUES (v_tenant_id, p_outlet_id, public.get_current_profile_id(), 'outlet.configured', 'outlet', p_outlet_id::text, p_payload, jsonb_build_object('auth_user_id', auth.uid()));
END;
$$;

-- 4. Archive / Remove Outlet RPC
CREATE FUNCTION public.delete_platform_outlet(p_outlet_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT tenant_id INTO STRICT v_tenant_id FROM public.outlets WHERE id = p_outlet_id FOR UPDATE;
  UPDATE public.outlets SET status = 'archived', updated_at = now() WHERE id = p_outlet_id;

  IF NOT EXISTS (SELECT 1 FROM public.outlets WHERE tenant_id = v_tenant_id AND status <> 'archived') THEN
    UPDATE public.tenants SET status = 'archived', updated_at = now() WHERE id = v_tenant_id;
  END IF;

  INSERT INTO public.audit_logs (tenant_id, outlet_id, actor_profile_id, action, entity_type, entity_id, metadata)
  VALUES (v_tenant_id, p_outlet_id, public.get_current_profile_id(), 'outlet.archived', 'outlet', p_outlet_id::text, jsonb_build_object('auth_user_id', auth.uid()));
END;
$$;

-- 5. Seed Demo Orders & Menu RPC for Admin "Seed Demo" Button
CREATE FUNCTION public.seed_platform_demo_orders(p_outlet_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_cat_id uuid;
  v_prod_ids uuid[];
  v_prod_names text[];
  v_prod_prices numeric[];
  v_prod_imgs text[];
  v_prod_stations text[];
  v_idx integer;
  v_order_id uuid;
  v_ticket_id uuid;
  v_item_id uuid;
  v_invoice text;
  v_token text;
  v_subtotal numeric;
  v_cgst numeric;
  v_total numeric;
  v_mode text;
  v_otype text;
  v_settings jsonb;
  v_order_snap jsonb;
  v_ticket_snap jsonb;
  v_local_day date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_start_year integer := extract(year from v_local_day) - (extract(month from v_local_day) < 4)::integer;
  v_fy text := v_start_year || '-' || right((v_start_year + 1)::text, 2);
  v_state text;
  v_customers text[] := ARRAY['Aarav M.', 'Diya N.', 'Rohan K.', 'Sneha I.', 'Vikash R.'];
  v_modes text[] := ARRAY['upi', 'card', 'cash', 'upi', 'cash'];
  v_types text[] := ARRAY['takeaway', 'dine_in', 'takeaway', 'delivery', 'dine_in'];
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Platform super admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT o.tenant_id, coalesce(s.code, '29') INTO STRICT v_tenant_id, v_state
  FROM public.outlets o LEFT JOIN public.states s ON s.id = o.state_id WHERE o.id = p_outlet_id;

  -- Ensure outlet has sample products if blank
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE tenant_id = v_tenant_id AND (outlet_id IS NULL OR outlet_id = p_outlet_id) AND is_active) THEN
    SELECT id INTO v_cat_id FROM public.categories WHERE tenant_id = v_tenant_id AND (outlet_id IS NULL OR outlet_id = p_outlet_id) AND is_active LIMIT 1;
    IF v_cat_id IS NULL THEN
      INSERT INTO public.categories (tenant_id, outlet_id, name, slug) VALUES (v_tenant_id, p_outlet_id, 'Signatures', 'signatures-' || substr(p_outlet_id::text, 1, 6)) RETURNING id INTO v_cat_id;
    END IF;
    INSERT INTO public.products (tenant_id, outlet_id, category_id, name, description, price, image_url, display_order, pos_station) VALUES
      (v_tenant_id, p_outlet_id, v_cat_id, 'Cappuccino', 'Double espresso with steamed milk.', 190, '/assets/coffee/studio/cappuccino.webp', 1, 'Expo'),
      (v_tenant_id, p_outlet_id, v_cat_id, 'Cold Brew', 'Slow-steeped black coffee over ice.', 220, '/assets/coffee/studio/cold-brew.webp', 2, 'Cold'),
      (v_tenant_id, p_outlet_id, v_cat_id, 'Butter Croissant', 'Flaky, golden all-butter croissant.', 165, '/assets/coffee/studio/croissant.webp', 3, 'Expo');
  END IF;

  SELECT array_agg(id), array_agg(name), array_agg(price), array_agg(coalesce(image_url, '')), array_agg(coalesce(pos_station, 'Expo'))
  INTO v_prod_ids, v_prod_names, v_prod_prices, v_prod_imgs, v_prod_stations
  FROM (
    SELECT id, name, price, image_url, pos_station
    FROM public.products
    WHERE tenant_id = v_tenant_id AND (outlet_id IS NULL OR outlet_id = p_outlet_id) AND is_active
    ORDER BY display_order LIMIT 3
  ) p;

  v_settings := public.pos_outlet_settings(p_outlet_id);

  FOR v_idx IN 1..5 LOOP
    v_order_id := gen_random_uuid();
    v_ticket_id := gen_random_uuid();
    v_item_id := gen_random_uuid();
    v_mode := v_modes[v_idx];
    v_otype := v_types[v_idx];
    v_subtotal := v_prod_prices[((v_idx - 1) % array_length(v_prod_ids, 1)) + 1] * 2;
    v_cgst := round(v_subtotal * 2.5 / 100, 2);
    v_total := round(v_subtotal + v_cgst * 2);
    v_invoice := public.generate_next_invoice_number(p_outlet_id, v_fy, 'INV/' || right(v_start_year::text, 2) || '/');
    v_token := 'Token #' || regexp_replace(split_part(v_invoice, '/', 3), '^0+', '');

    v_order_snap := jsonb_build_object(
      'id', v_order_id, 'orderNumber', v_token, 'type', replace(v_otype, '_', '-'),
      'customerName', v_customers[v_idx], 'guestCount', 1,
      'tableNumber', CASE WHEN v_otype = 'dine_in' THEN 'T-01' END,
      'subtotal', v_subtotal, 'discount', 0, 'discountPercent', 0,
      'cgst', v_cgst, 'sgst', v_cgst, 'tax', v_cgst * 2, 'total', v_total, 'roundingAdjustment', v_total - (v_subtotal + v_cgst * 2),
      'paymentMode', v_mode, 'paymentStatus', 'paid', 'paymentReference', CASE WHEN v_mode = 'cash' THEN NULL ELSE 'DEMO' || v_idx END,
      'cashTendered', CASE WHEN v_mode = 'cash' THEN v_total END, 'cashChange', 0,
      'cashierName', 'Demo Counter', 'createdAt', now() - ((5 - v_idx) * interval '18 minutes'),
      'status', CASE WHEN v_idx <= 3 THEN 'completed' ELSE 'preparing' END,
      'invoiceNumber', v_invoice, 'receiptSettings', v_settings, 'posStateCode', v_state, 'gstRate', 5,
      'items', jsonb_build_array(jsonb_build_object(
        'cartItemId', v_item_id, 'quantity', 2, 'selectedAddOns', '[]'::jsonb,
        'unitPrice', v_subtotal / 2, 'lineTotal', v_subtotal, 'specialInstructions', '',
        'product', jsonb_build_object(
          'id', v_prod_ids[((v_idx - 1) % array_length(v_prod_ids, 1)) + 1],
          'name', v_prod_names[((v_idx - 1) % array_length(v_prod_names, 1)) + 1],
          'price', v_subtotal / 2,
          'image', v_prod_imgs[((v_idx - 1) % array_length(v_prod_imgs, 1)) + 1],
          'station', v_prod_stations[((v_idx - 1) % array_length(v_prod_stations, 1)) + 1]
        )
      ))
    );

    v_ticket_snap := jsonb_build_object(
      'id', v_ticket_id, 'orderId', v_order_id, 'orderNumber', v_token, 'orderType', replace(v_otype, '_', '-'),
      'customerName', v_customers[v_idx], 'guestCount', 1,
      'channel', CASE WHEN v_otype = 'dine_in' THEN 'Table Service' ELSE 'Counter Express' END,
      'targetMinutes', 7, 'createdAt', now() - ((5 - v_idx) * interval '18 minutes'),
      'status', CASE WHEN v_idx <= 3 THEN 'bumped' WHEN v_idx = 4 THEN 'ready' ELSE 'new' END,
      'isRush', false,
      'items', jsonb_build_array(jsonb_build_object(
        'id', v_item_id, 'productId', v_prod_ids[((v_idx - 1) % array_length(v_prod_ids, 1)) + 1],
        'name', v_prod_names[((v_idx - 1) % array_length(v_prod_names, 1)) + 1],
        'quantity', 2, 'station', v_prod_stations[((v_idx - 1) % array_length(v_prod_stations, 1)) + 1],
        'isReady', v_idx <= 4, 'modifiers', '[]'::jsonb
      ))
    );

    INSERT INTO public.orders (id, tenant_id, outlet_id, order_number, order_type, status, customer_name, subtotal, tax_total, rounding_adjustment, grand_total, item_count, pos_snapshot, created_at)
    VALUES (v_order_id, v_tenant_id, p_outlet_id, v_token, v_otype, CASE WHEN v_idx <= 3 THEN 'completed' WHEN v_idx = 4 THEN 'ready' ELSE 'preparing' END, v_customers[v_idx], v_subtotal, v_cgst * 2, v_total - (v_subtotal + v_cgst * 2), v_total, 1, v_order_snap, now() - ((5 - v_idx) * interval '18 minutes'));

    INSERT INTO public.order_items (id, order_id, product_id, name, quantity, unit_price, total_price)
    VALUES (v_item_id, v_order_id, v_prod_ids[((v_idx - 1) % array_length(v_prod_ids, 1)) + 1], v_prod_names[((v_idx - 1) % array_length(v_prod_names, 1)) + 1], 2, v_subtotal / 2, v_subtotal);

    INSERT INTO public.kds_tickets (id, order_id, tenant_id, outlet_id, ticket_number, status, pos_snapshot, created_at)
    VALUES (v_ticket_id, v_order_id, v_tenant_id, p_outlet_id, v_token, CASE WHEN v_idx <= 3 THEN 'delivered' WHEN v_idx = 4 THEN 'ready' ELSE 'pending' END, v_ticket_snap, now() - ((5 - v_idx) * interval '18 minutes'));

    INSERT INTO public.kds_ticket_items (id, ticket_id, order_item_id, status)
    VALUES (v_item_id, v_ticket_id, v_item_id, CASE WHEN v_idx <= 3 THEN 'delivered' WHEN v_idx = 4 THEN 'ready' ELSE 'pending' END);

    INSERT INTO public.payments (order_id, tenant_id, outlet_id, payment_method, amount, reference_number)
    VALUES (v_order_id, v_tenant_id, p_outlet_id, v_mode, v_total, CASE WHEN v_mode = 'cash' THEN NULL ELSE 'DEMO' || v_idx END);

    INSERT INTO public.invoices (tenant_id, outlet_id, order_id, invoice_number, financial_year, place_of_supply_state_code, customer_name, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, grand_total, immutable_payload_snapshot)
    VALUES (v_tenant_id, p_outlet_id, v_order_id, v_invoice, v_fy, v_state, v_customers[v_idx], v_subtotal, 2.5, v_cgst, 2.5, v_cgst, v_total, v_order_snap);
  END LOOP;

  RETURN 5;
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_admin_workspace(), public.update_platform_outlet(uuid, jsonb), public.delete_platform_outlet(uuid), public.seed_platform_demo_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_workspace(), public.update_platform_outlet(uuid, jsonb), public.delete_platform_outlet(uuid), public.seed_platform_demo_orders(uuid) TO authenticated;
