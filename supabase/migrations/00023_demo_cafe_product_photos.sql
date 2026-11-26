-- Refresh the bundled café catalog images for existing demo outlets.
UPDATE public.products AS product
SET image_url = '/assets/coffee/studio/' || photo.filename
FROM (VALUES
  ('30000000-0000-4000-8000-000000000020'::uuid, 'espresso.webp'),
  ('30000000-0000-4000-8000-000000000021'::uuid, 'cappuccino.webp'),
  ('30000000-0000-4000-8000-000000000022'::uuid, 'cold-brew.webp'),
  ('30000000-0000-4000-8000-000000000023'::uuid, 'iced-latte.webp'),
  ('30000000-0000-4000-8000-000000000024'::uuid, 'matcha.webp'),
  ('30000000-0000-4000-8000-000000000025'::uuid, 'croissant.webp'),
  ('30000000-0000-4000-8000-000000000026'::uuid, 'cookie.webp'),
  ('30000000-0000-4000-8000-000000000027'::uuid, 'toastie.webp'),
  ('30000000-0000-4000-8000-000000000028'::uuid, 'banana-bread.webp')
) AS photo(product_id, filename)
WHERE product.id = photo.product_id
  AND product.outlet_id = 'b0000000-0000-0000-0000-000000000001'
  AND (nullif(product.image_url, '') IS NULL OR product.image_url = '/assets/coffee/' || photo.filename);
