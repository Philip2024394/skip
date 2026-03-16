-- Validate and repair gift URLs
-- This script checks for broken URLs and repairs them

-- Check current gift data
SELECT 
    id,
    name,
    image_url,
    image_name,
    token_price,
    CASE 
        WHEN image_url LIKE '%imagekit.io%' THEN 'Valid ImageKit URL'
        WHEN image_url LIKE '%http%' THEN 'External URL'
        ELSE 'Invalid URL'
    END as url_status
FROM virtual_gifts 
ORDER BY token_price;

-- Update any broken URLs (if needed)
UPDATE virtual_gifts 
SET image_url = 'https://ik.imagekit.io/7grri5v7d/' || image_name || '-removebg-preview.png?updatedAt=1773600000000'
WHERE image_url NOT LIKE '%imagekit.io%' AND image_url NOT LIKE '%http%';

-- Verify token prices are correct
SELECT 
    name,
    token_price,
    CASE 
        WHEN token_price BETWEEN 2 AND 25 THEN 'Valid Price Range'
        ELSE 'Invalid Price'
    END as price_validation
FROM virtual_gifts 
ORDER BY token_price;

-- Count total gifts
SELECT COUNT(*) as total_gifts FROM virtual_gifts WHERE is_active = true;
