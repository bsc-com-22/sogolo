-- EMERGENCY ADMIN FIX - Disable RLS Temporarily
-- RUN THIS IF OTHER FIXES DON'T WORK

-- 1. Completely disable RLS (temporary fix)
ALTER TABLE kyc_verifications DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions
GRANT ALL ON kyc_verifications TO authenticated;
GRANT ALL ON kyc_verifications TO service_role;

-- 3. Test access
SELECT * FROM kyc_verifications LIMIT 5;

-- 4. Verify your admin role
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'chidaziblessings@gmail.com';

-- AFTER TESTING IS COMPLETE, RE-ENABLE SECURITY:
-- Run the complete-admin-fix.sql script to properly set up RLS
