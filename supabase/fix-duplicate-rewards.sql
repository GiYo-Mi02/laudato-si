-- Fix duplicate rewards - keep the ones with images and restore stock
-- This will delete old duplicates and update the image-enabled rewards with proper stock

-- 1. Delete the OLD rewards (no images, original stock)
DELETE FROM rewards 
WHERE id IN (
  '00e15b8f-5a6a-4e40-bdbb-81c2e5afc2ab', -- Free Coffee (old)
  'd59d0591-b474-4823-940f-2aa718d07404', -- Plant Kit (old)
  '00865af5-7156-4517-86f7-af6e2882467a', -- UMak Tumbler (old)
  '7e7b225b-c674-4c91-a3f8-cbd45e28bcc3', -- Eco Tote Bag (old)
  '9c4ef07e-ba6c-45b8-b789-879e2a9e70bf'  -- Cafeteria Discount (old)
);

-- 2. Update the NEW rewards (with images) to have proper stock
UPDATE rewards SET total_quantity = 50, remaining_quantity = 50
WHERE id = 'f47bec5d-e72a-46ac-9f20-21a2c47dc570'; -- Free Coffee (with image)

UPDATE rewards SET total_quantity = 20, remaining_quantity = 20
WHERE id = '2ff85580-8e91-4238-a37a-a817ef559159'; -- Plant Kit (with image)

UPDATE rewards SET total_quantity = 50, remaining_quantity = 50
WHERE id = 'b65399b5-0b68-4afa-b32a-1cb5a875dd13'; -- UMak Tumbler (with image)

UPDATE rewards SET total_quantity = 30, remaining_quantity = 30
WHERE id = '0f64d3f0-de7a-4f53-a489-1b5da1ea4fb8'; -- Eco Tote Bag (with image)

UPDATE rewards SET total_quantity = 100, remaining_quantity = 100
WHERE id = '502a9c67-a228-4bf7-9451-7ffef63adf16'; -- Cafeteria Discount (with image)

-- 3. Verify the fix
SELECT 
  name,
  cost,
  total_quantity,
  remaining_quantity,
  CASE WHEN image_url IS NOT NULL THEN '✅ Has image' ELSE '❌ No image' END as image_status
FROM rewards
WHERE is_active = true
ORDER BY name;
