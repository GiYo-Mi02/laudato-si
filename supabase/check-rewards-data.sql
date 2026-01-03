-- Check reward data directly
-- Run this to see what's actually in the database

SELECT 
  id,
  name,
  cost,
  total_quantity,
  remaining_quantity,
  is_active,
  image_url,
  LENGTH(image_url) as url_length,
  updated_at
FROM rewards
ORDER BY name;
