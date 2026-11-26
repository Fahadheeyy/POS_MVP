-- =========================================================================
-- MIGRATION 00007: Seed Sign Laban Menu Catalog (Categories, Products & Modifiers)
-- =========================================================================

-- 1. Categories
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Qashtuta (Tres Leches)', 'qashtuta', 1)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Umm Ali (Warm)', 'umm_ali', 2)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Koushiri & Ambalyh', 'koushiri', 3)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bambooza & Halibo', 'bambooza', 4)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lou''a Bites', 'loua', 5)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Signatures & Cakes', 'signatures', 6)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Aseerathul & Drinks', 'beverages', 7)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.categories (id, tenant_id, outlet_id, name, slug, display_order)
VALUES ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Combos & Dips', 'combos', 8)
ON CONFLICT (tenant_id, outlet_id, slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Modifier Groups & Options
INSERT INTO public.modifier_groups (id, tenant_id, outlet_id, name, min_selection, max_selection, is_required)
VALUES ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Extra Sauces & Drizzles', 0, 3, false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Extra Pistachio Drizzle', 60.00, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Extra Lotus Biscoff Sauce', 50.00, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Extra Warm Nutella', 50.00, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Belgian Chocolate Sauce', 50.00, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'White Kinder Hazelnut Cream', 60.00, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_groups (id, tenant_id, outlet_id, name, min_selection, max_selection, is_required)
VALUES ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Crunch & Add-ons', 0, 2, false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000002', 'Toasted Golden Kunafa', 40.00, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000002', 'Roasted Hazelnuts & Praline', 45.00, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000002', 'Crushed Oreo Crumble', 35.00, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modifier_options (id, group_id, name, price_delta, display_order)
VALUES ('21000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000002', 'Fresh Alphonso Mango Cubes', 50.00, 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Pistachio', '', 'Tres Leches Egyptian milk sponge cake soaked in pistachio milk, layered with fresh cream and rich Iranian pistachio paste.', 320.00, '996331', true, '/assets/products/sign_laban/QashtutaPistachio.png', 1)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Lotus', '', 'Soft milk sponge soaked in Biscoff infused milk, whipped cream, and crowned with caramelized Lotus cookie crumble.', 280.00, '996331', true, '/assets/products/sign_laban/QashtutaLotus.png', 2)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Mango', '', 'Tres Leches milk cake layered with fresh Alphonso mango pulp and succulent sweet mango cubes.', 260.00, '996331', true, '/assets/products/sign_laban/QashtutaMango.png', 3)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qashtuta Nutella Hazelnut', '', 'Egyptian milk sponge drenched in chocolate milk, smothered with Nutella fudge and roasted crunchy hazelnuts.', 290.00, '996331', true, '/assets/products/sign_laban/QashtutaNutellahazelnut.png', 4)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio', '', 'Traditional warm Egyptian puff pastry pudding baked with hot vanilla milk, sweet Ashta cream, and roasted Iranian pistachios.', 290.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachio.png', 5)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Lotus', '', 'Warm flaky pastry pudding bathed in caramelized Lotus milk, topped with warm Biscoff spread and golden crumbs.', 270.00, '996331', true, '/assets/products/sign_laban/UmmAliLotus.png', 6)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Nutella', '', 'Warm Egyptian milk pudding covered with melted silky Nutella and toasted almond flakes.', 270.00, '996331', true, '/assets/products/sign_laban/UmmAliNutella.png', 7)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio Nutella', '', 'The ultimate duo: half warm pistachio cream, half melted Nutella over baked Egyptian puff pudding.', 320.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachioNutella.png', 8)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Umm Ali Pistachio Lotus', '', 'Signature half-and-half bowl: rich warm pistachio praline and Belgian Lotus Biscoff glaze.', 320.00, '996331', true, '/assets/products/sign_laban/UmmAliPistachioLotus.png', 9)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Koushiri Sweet Pistachio', '', 'Sweet dessert rendition of Egypt national dish: toasted crunchy kunafa noodles, velvety rice pudding cream, toasted nuts, and pistachio drizzle.', 310.00, '996331', true, '/assets/products/sign_laban/KoushiriPistachio.png', 10)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Koushiri Sweet Lotus', '', 'Crisp toasted kunafa threads layered with sweetened clotted milk cream and warm Lotus Biscoff caramel.', 280.00, '996331', true, '/assets/products/sign_laban/KoushiriLotus.png', 11)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ambalyh Mango', '', 'Layered Egyptian custard pudding with sweet crushed biscuit base, thick Ashta, and sweet Alphonso mango cubes.', 260.00, '996331', true, '/assets/products/sign_laban/AmbalyhMango.png', 12)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ambalyh Lotus', '', 'Classic Egyptian dessert bowl with layers of milk cream custard, Lotus biscuit butter, and cinnamon aroma.', 270.00, '996331', true, '/assets/products/sign_laban/AmbalyhLotus.png', 13)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Pistachio', '', 'Viral Egyptian Bambooza dessert bowl with soft milk cake base, crunchy toasted kunafa nest, and double pistachio cream.', 330.00, '996331', true, '/assets/products/sign_laban/BamboozaPistachio.png', 14)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Lotus', '', 'Bambooza bowl layered with sweet soaked sponge, Biscoff cookie crunch, and velvety caramel glaze.', 290.00, '996331', true, '/assets/products/sign_laban/BamboozaLotus.png', 15)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Nutella', '', 'Luscious Bambooza bowl drenched in rich Nutella hazelnut sauce and crunchy wafer crisps.', 290.00, '996331', true, '/assets/products/sign_laban/BamboozaNutella.png', 16)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bambooza Mango', '', 'Tropical Bambooza bowl layered with chilled milk sponge, sweet mango cream, and fresh diced mango.', 270.00, '996331', true, '/assets/products/sign_laban/BamboozaMango.png', 17)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Pistachio', '', 'Fluffy whipped milk mousse cup infused with real pistachio cream and crushed roasted nuts.', 310.00, '996331', true, '/assets/products/sign_laban/HaliboPistachio.png', 18)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Nutella', '', 'Chilled chocolate milk mousse cup with Nutella chocolate ribbons and biscuit crumble.', 280.00, '996331', true, '/assets/products/sign_laban/HaliboNutella.png', 19)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Halibo Lotus', '', 'Creamy whipped Ashta milk mousse layered with Lotus Biscoff butter and cookie crumbs.', 280.00, '996331', true, '/assets/products/sign_laban/HaliboLotus.png', 20)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Pistachio Bites', '', 'Crispy golden fried sweet pastry bites smothered in warm silky pistachio cream.', 260.00, '996331', true, '/assets/products/sign_laban/LouaPistachio.png', 21)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Nutella Bites', '', 'Crunchy Egyptian pastry bite cups drenched in melted Nutella fudge.', 240.00, '996331', true, '/assets/products/sign_laban/LouaNutella.png', 22)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Lotus Bites', '', 'Crispy golden bite cups generously coated in warm caramelized Lotus Biscoff glaze.', 240.00, '996331', true, '/assets/products/sign_laban/LouaLotus.png', 23)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Kinder Cream Bites', '', 'Warm crispy pastry cups topped with melted white hazelnut Kinder cream and milk chocolate streaks.', 270.00, '996331', true, '/assets/products/sign_laban/LouaKinder.png', 24)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Nutella & Pistachio Duo', '', 'Half Nutella, half Pistachio sauce over warm, freshly fried crunchy pastry cups.', 290.00, '996331', true, '/assets/products/sign_laban/LouaNutellaPistachio.png', 25)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lou''a Pistachio & Lotus Duo', '', 'Duo of warm pistachio cream and Lotus Biscoff sauce poured over crispy sweet pastry cups.', 290.00, '996331', true, '/assets/products/sign_laban/LouaPistachioLotus.png', 26)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Saankorita Dessert Tower', '', 'The viral Egyptian dessert sensation: multi-layered crunchy kunafa tower, fresh Ashta cream, Lotus crumble, and pistachio sauce.', 360.00, '996331', true, '/assets/products/sign_laban/SAANKORITA.png', 27)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'The Egyptian Bomb', '', 'Signature crisp chocolate kunafa sphere filled with molten clotted cream, pistachio paste, and warm Nutella lava.', 380.00, '996331', true, '/assets/products/sign_laban/bomb.png', 28)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'De Paris Mascarpone Kunafa', '', 'French-Egyptian fusion pastry layered with whipped mascarpone cream, dark Belgian chocolate, and crispy pastry flakes.', 340.00, '996331', true, '/assets/products/sign_laban/deparis.png', 29)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Elsabika Gold Ingot', '', 'Golden ingot dessert cake layered with sweet clotted Ashta cream, honey syrup, and roasted pistachios.', 350.00, '996331', true, '/assets/products/sign_laban/Elsabika.png', 30)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Almazeya Rose Milk Cup', '', 'Egyptian diamond dessert cup infused with natural rosewater milk, sweet cream, and crushed Iranian pistachios.', 320.00, '996331', true, '/assets/products/sign_laban/almazeya.png', 31)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kashkha Royal Ashta', '', 'Royal Egyptian dessert with rich fresh Ashta cream, toasted kunafa threads, and edible silver leaf garnishing.', 350.00, '996331', true, '/assets/products/sign_laban/KASHKHA.png', 32)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fazea Chocolate Pot', '', 'Decadent dark chocolate and crunchy kunafa pot with molten chocolate center and crushed biscuit base.', 330.00, '996331', true, '/assets/products/sign_laban/fazea.png', 33)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fazea Pistachio Sponge Cake', '', 'Moist layered pistachio sponge cake smothered in rich pistachio ganache and toasted chopped pistachios.', 360.00, '996331', true, '/assets/products/sign_laban/fezea-pistachio-cake.png', 34)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hazelnut Praline Kunafa Bar', '', 'Crunchy wafer and kunafa bar filled with roasted hazelnut praline, dipped in Belgian milk chocolate.', 280.00, '996331', true, '/assets/products/sign_laban/hazeel-nut-bar.png', 35)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'London Love Story Kunafa', '', 'Romantic dessert bowl with sweet fresh strawberries, clotted whipped cream, and Belgian milk chocolate kunafa.', 350.00, '996331', true, '/assets/products/sign_laban/london-love-story.png', 36)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Qishta Clotted Cream Bowl', '', 'Authentic traditional Egyptian clotted buffalo cream bowl served with pure mountain honey and raw almonds.', 260.00, '996331', true, '/assets/products/sign_laban/QISHTA.png', 37)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kab''sa Sweet Kunafa Bowl', '', 'Playful dessert resembling golden saffron rice crafted with sweet toasted kunafa, saffron cream, and pistachios.', 340.00, '996331', true, '/assets/products/sign_laban/kabsa.png', 38)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Roh Hayati Almond Milk Cup', '', 'Heart of Life Egyptian milk dessert perfumed with green cardamom, sweet cream, and slivered blanched almonds.', 330.00, '996331', true, '/assets/products/sign_laban/rohhayati.png', 39)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Pistachio Shake', '', 'Thick Egyptian chilled bottled shake blended with pure Iranian pistachio paste, cold milk, and crushed pistachios.', 240.00, '996331', true, '/assets/products/sign_laban/Aseerathulpistachio.png', 40)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Nutella Shake', '', 'Rich and creamy chilled bottled shake with authentic Nutella and chocolate cream.', 220.00, '996331', true, '/assets/products/sign_laban/AseerathulNutella.png', 41)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Lotus Shake', '', 'Signature spiced Biscoff cookie shake blended with clotted cream and cold full-cream milk.', 220.00, '996331', true, '/assets/products/sign_laban/Aseerathullotus.png', 42)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pure Alphonso Mango Shake', '', '100% pure Alphonso mango pulp blended with chilled whole milk and sweet syrup.', 180.00, '996331', true, '/assets/products/sign_laban/Mango.png', 43)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mango Strawberry Nectar', '', 'Refreshing duo of golden Alphonso mango and fresh mountain strawberry nectar.', 200.00, '996331', true, '/assets/products/sign_laban/MangoStrawberry.png', 44)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mango Banana Smoothie', '', 'Creamy tropical blend of sweet mango and ripe banana with honey.', 190.00, '996331', true, '/assets/products/sign_laban/MangoBanana.png', 45)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Banana Strawberry Shake', '', 'Classic combination of farm strawberries and fresh bananas with chilled cream.', 190.00, '996331', true, '/assets/products/sign_laban/BananaStrawberry.png', 46)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Anar Tender Coconut Nectar', '', 'Fresh ruby pomegranate pearls infused in sweet coastal tender coconut water and malai.', 210.00, '996331', true, '/assets/products/sign_laban/AnarTenderCoconut.png', 47)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Nutella + Bomb Combo', '', 'Power combo: 1x Chilled Bottled Aseerathul Nutella Shake + 1x Signature Egyptian Chocolate Bomb.', 499.00, '996331', true, '/assets/products/sign_laban/img1.png', 48)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000048', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000048', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Lotus + Lou''a Cup Combo', '', 'Signature combo: 1x Bottled Aseerathul Lotus Shake + 1x Lou''a Crispy Pastry Bites Bowl.', 449.00, '996331', true, '/assets/products/sign_laban/img2.png', 49)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000049', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000049', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Aseerathul Pistachio + Kab''sa Combo', '', 'The Royal Green combo: 1x Bottled Aseerathul Pistachio Shake + 1x Sweet Kab''sa Kunafa Bowl.', 520.00, '996331', true, '/assets/products/sign_laban/img3.png', 50)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000050', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.product_modifier_groups (product_id, group_id)
VALUES ('30000000-0000-0000-0000-000000000050', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (product_id, group_id) DO NOTHING;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pure Pistachio Spread Dip Jar', '', 'Extra takeaway jar of 100% natural Iranian pistachio spread.', 75.00, '996331', true, '/assets/products/sign_laban/Pistachio.png', 51)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lotus Biscoff Sauce Jar', '', 'Extra takeaway jar of warm caramelized Lotus Biscoff spread.', 60.00, '996331', true, '/assets/products/sign_laban/Lotus.png', 52)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Warm Nutella Fudge Jar', '', 'Extra takeaway jar of velvety warm Nutella chocolate.', 60.00, '996331', true, '/assets/products/sign_laban/Nutella.png', 53)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Belgian Dark Chocolate Dip', '', 'Rich melted Belgian chocolate sauce cup.', 60.00, '996331', true, '/assets/products/sign_laban/Chocolate.png', 54)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella & Lotus Duo Dip', '', 'Split twin dip cup with Nutella and Lotus Biscoff sauces.', 70.00, '996331', true, '/assets/products/sign_laban/NutellaLotus.png', 55)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella & Pistachio Duo Dip', '', 'Split twin dip cup with melted Nutella and Iranian pistachio cream.', 75.00, '996331', true, '/assets/products/sign_laban/NutellaPistachio.png', 56)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nutella Hazelnut Crunch Dip', '', 'Nutella sauce cup mixed with crushed roasted hazelnuts.', 75.00, '996331', true, '/assets/products/sign_laban/Nutellahazelnut.png', 57)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio & Lotus Duo Dip', '', 'Split twin dip cup with pistachio cream and Lotus Biscoff spread.', 75.00, '996331', true, '/assets/products/sign_laban/PistachioLotus.png', 58)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio Kinder White Dip', '', 'Warm pistachio sauce blended with melted white Kinder cream.', 80.00, '996331', true, '/assets/products/sign_laban/PistachioKinderChocolate.png', 59)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pistachio Belgian Chocolate Dip', '', 'Pure pistachio cream swirled with Belgian chocolate.', 80.00, '996331', true, '/assets/products/sign_laban/PistachiobelgiumChocolate.png', 60)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, tenant_id, outlet_id, category_id, name, short_name, description, price, hsn_sac_code, is_veg, image_url, display_order)
VALUES ('30000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Crushed Oreo Cookie Cup', '', 'Crunchy crushed Oreo cookies for topping over desserts.', 45.00, '996331', true, '/assets/products/sign_laban/Oreo.png', 61)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;
