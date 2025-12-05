-- Check product_submissions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_submissions';

-- Check RLS policies on product_submissions
SELECT * FROM pg_policies WHERE tablename = 'product_submissions';

-- Check if there are any submissions for the transaction (replace with a known ID if possible, or just list recent)
SELECT * FROM product_submissions ORDER BY created_at DESC LIMIT 5;
