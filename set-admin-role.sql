-- SQL Script to Make a User an Admin
-- Run this in your Supabase SQL Editor

-- Option 1: Update a specific user by email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'your-email@example.com'  -- Replace with your actual email
);

-- Option 2: Update a specific user by their user ID
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'your-user-id-here';

-- Verify the update
SELECT id, email, role, kyc_status 
FROM profiles 
WHERE role = 'admin';
