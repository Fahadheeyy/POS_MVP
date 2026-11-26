-- Local Supabase demo seed. Keep historical order and invoice snapshots intact.
BEGIN;
UPDATE public.tenants SET name = 'Daybreak Coffee', brand_name = 'Daybreak Coffee' WHERE id = 'a0000000-0000-0000-0000-000000000001' AND slug LIKE 'sign-laban%';
UPDATE public.outlets SET name = 'Daybreak Coffee · Indiranagar', email = 'indiranagar@daybreak.test' WHERE id = 'b0000000-0000-0000-0000-000000000001' AND name LIKE 'Sign Laban%';
UPDATE public.outlet_business_profiles SET tagline = 'Specialty coffee & bakery', receipt_header = 'Daybreak Coffee · Indiranagar', receipt_footer = 'Thanks for visiting Daybreak Coffee.' WHERE outlet_id = 'b0000000-0000-0000-0000-000000000001' AND receipt_header LIKE 'Sign Laban%';
UPDATE public.categories SET is_active = false WHERE outlet_id = 'b0000000-0000-0000-0000-000000000001' AND id::text LIKE '10000000-0000-0000-0000-%';
UPDATE public.products SET is_active = false WHERE outlet_id = 'b0000000-0000-0000-0000-000000000001' AND id::text LIKE '30000000-0000-0000-0000-%';
UPDATE public.modifier_groups SET is_active = false WHERE outlet_id = 'b0000000-0000-0000-0000-000000000001' AND id::text LIKE '20000000-0000-0000-0000-%';
INSERT INTO public.categories (id,tenant_id,outlet_id,name,slug,display_order) VALUES
('10000000-0000-4000-8000-000000000020','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Coffee','coffee',0),
('10000000-0000-4000-8000-000000000021','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Iced drinks','iced',1),
('10000000-0000-4000-8000-000000000022','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Bakery','bakery',2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (id,tenant_id,outlet_id,category_id,name,description,price,image_url,display_order,pos_station) VALUES
('30000000-0000-4000-8000-000000000020','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000020','Espresso','A double shot with dark chocolate and caramel notes.',120,'/assets/coffee/studio/espresso.webp',0,'Expo'),
('30000000-0000-4000-8000-000000000021','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000020','Cappuccino','Double espresso with steamed milk and silky foam.',190,'/assets/coffee/studio/cappuccino.webp',1,'Expo'),
('30000000-0000-4000-8000-000000000022','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000021','Cold Brew','Slow-steeped black coffee poured over ice.',220,'/assets/coffee/studio/cold-brew.webp',2,'Cold'),
('30000000-0000-4000-8000-000000000023','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000021','Iced Vanilla Latte','Espresso, chilled milk and house vanilla.',240,'/assets/coffee/studio/iced-latte.webp',3,'Cold'),
('30000000-0000-4000-8000-000000000024','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000021','Matcha Latte','Stone-ground matcha whisked with milk.',260,'/assets/coffee/studio/matcha.webp',4,'Cold'),
('30000000-0000-4000-8000-000000000025','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000022','Butter Croissant','A flaky, golden all-butter croissant.',165,'/assets/coffee/studio/croissant.webp',5,'Expo'),
('30000000-0000-4000-8000-000000000026','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000022','Dark Chocolate Cookie','A soft-baked cookie with dark chocolate chunks.',130,'/assets/coffee/studio/cookie.webp',6,'Expo'),
('30000000-0000-4000-8000-000000000027','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000022','Grilled Cheese Toastie','Griddled sourdough with a melted cheese filling.',280,'/assets/coffee/studio/toastie.webp',7,'Expo'),
('30000000-0000-4000-8000-000000000028','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000022','Banana Walnut Bread','A thick slice of banana loaf with toasted walnuts.',155,'/assets/coffee/studio/banana-bread.webp',8,'Expo')
ON CONFLICT (id) DO NOTHING;
COMMIT;
