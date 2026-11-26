-- Persist the catalog controls used by the manager and the kitchen's 86 list.
CREATE FUNCTION public.pos_catalog(p_action text, p_item jsonb, p_outlet uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
<<catalog>>
DECLARE
  session jsonb := public.get_pos_session(p_outlet);
  outlet uuid := (session->>'outletId')::uuid;
  tenant uuid := (session->>'tenantId')::uuid;
  item_id uuid := coalesce((p_item->>'id')::uuid, gen_random_uuid());
  group_id uuid := (p_item->>'groupId')::uuid;
  category_id uuid := (p_item->>'categoryId')::uuid;
  name text := nullif(btrim(p_item->>'name'), '');
  price numeric := (p_item->>'price')::numeric;
BEGIN
  IF outlet IS NULL OR NOT (
    session->'effectivePermissions' ? 'menu.manage' OR
    (p_action = 'availability' AND session->'effectivePermissions' ? 'kds.access')
  ) THEN RAISE EXCEPTION 'Catalog permission required' USING ERRCODE = '42501'; END IF;

  PERFORM 1 FROM public.outlets WHERE id = outlet FOR UPDATE;
  IF price IS NOT NULL AND price NOT BETWEEN 0 AND 100000000 THEN RAISE EXCEPTION 'Enter a valid price'; END IF;
  CASE p_action
    WHEN 'availability' THEN
      UPDATE public.products SET is_active = (p_item->>'isAvailable')::boolean, updated_at = now()
      WHERE id = item_id AND outlet_id = outlet AND tenant_id = tenant;
      IF NOT FOUND THEN RAISE EXCEPTION 'This item is managed at tenant level or is unavailable'; END IF;
    WHEN 'product' THEN
      IF category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.tenant_id = tenant
          AND (c.outlet_id = outlet OR c.outlet_id IS NULL) AND c.is_active
      ) THEN RAISE EXCEPTION 'Choose an available category'; END IF;

      IF p_item ? 'id' THEN
        UPDATE public.products p SET name = coalesce(catalog.name, p.name),
          price = coalesce(catalog.price, p.price), category_id = coalesce(catalog.category_id, p.category_id),
          description = coalesce(p_item->>'description', p.description),
          image_url = coalesce(p_item->>'image', p.image_url), pos_station = coalesce(p_item->>'station', p.pos_station),
          is_active = coalesce((p_item->>'isAvailable')::boolean, p.is_active), updated_at = now()
        WHERE id = item_id AND outlet_id = outlet AND tenant_id = tenant;
        IF NOT FOUND THEN RAISE EXCEPTION 'This item is managed at tenant level or is unavailable'; END IF;
      ELSE
        IF name IS NULL OR category_id IS NULL OR price IS NULL THEN RAISE EXCEPTION 'Name, price, and category are required'; END IF;
        INSERT INTO public.products(id,tenant_id,outlet_id,category_id,name,price,description,image_url,pos_station)
        VALUES (item_id,tenant,outlet,category_id,name,price,p_item->>'description',p_item->>'image',coalesce(p_item->>'station','Cold'));
      END IF;
      IF p_item ? 'addOnGroupIds' THEN
        DELETE FROM public.product_modifier_groups j WHERE j.product_id = item_id;
        INSERT INTO public.product_modifier_groups(product_id, group_id)
          SELECT DISTINCT item_id, g.id FROM jsonb_array_elements_text(p_item->'addOnGroupIds') AS groups(id)
          JOIN public.modifier_groups g ON g.id = groups.id::uuid
          WHERE g.tenant_id = tenant AND (g.outlet_id IS NULL OR g.outlet_id = outlet);
      END IF;
    WHEN 'group' THEN
      IF name IS NULL OR (p_item->>'minSelect')::integer NOT BETWEEN 0 AND 30 OR
        (p_item->>'maxSelect')::integer NOT BETWEEN (p_item->>'minSelect')::integer AND 30 THEN
        RAISE EXCEPTION 'Enter a group name and valid selection limits';
      END IF;
      INSERT INTO public.modifier_groups(tenant_id,outlet_id,name,min_selection,max_selection,is_required)
      VALUES (tenant,outlet,name,(p_item->>'minSelect')::integer,(p_item->>'maxSelect')::integer,(p_item->>'minSelect')::integer > 0);
    WHEN 'modifier', 'remove_modifier' THEN
      IF NOT EXISTS (SELECT 1 FROM public.modifier_groups g WHERE g.id = group_id AND g.tenant_id = tenant AND g.outlet_id = outlet) THEN
        RAISE EXCEPTION 'This modifier group is managed at tenant level or is unavailable';
      END IF;
      IF p_action = 'remove_modifier' THEN
        UPDATE public.modifier_options m SET is_active = false, updated_at = now()
          WHERE m.id = item_id AND m.group_id = catalog.group_id;
      ELSIF p_item ? 'id' THEN
        UPDATE public.modifier_options m SET name = coalesce(catalog.name, m.name),
          price_delta = coalesce(price, m.price_delta), pos_image = coalesce(p_item->>'image', m.pos_image),
          is_active = coalesce((p_item->>'isAvailable')::boolean, m.is_active), updated_at = now()
          WHERE m.id = item_id AND m.group_id = catalog.group_id;
      ELSE
        IF name IS NULL OR price IS NULL THEN RAISE EXCEPTION 'Name and price are required'; END IF;
        INSERT INTO public.modifier_options(group_id,name,price_delta,pos_image)
          VALUES (group_id,name,price,p_item->>'image');
      END IF;
    ELSE RAISE EXCEPTION 'Unknown catalog action';
  END CASE;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_catalog(text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_catalog(text,jsonb,uuid) TO authenticated;
