-- CLEAN ADMIN FIX - Handle Existing Policies
-- Run this in Supabase SQL Editor

-- 1. Check current KYC data count (this shows 294 records exist)
SELECT 
    'Current KYC Records' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM kyc_verifications;

-- 2. Show sample records to verify data exists
SELECT 
    id,
    full_name,
    phone,
    status,
    created_at
FROM kyc_verifications
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check your admin status
SELECT 
    auth.uid() as current_admin_id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'user_role' as user_role
FROM auth.users 
WHERE id = auth.uid();

-- 4. Drop all existing policies cleanly
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can insert KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Super admin bypass all" ON kyc_verifications;
DROP POLICY IF EXISTS "Emergency admin access" ON kyc_verifications;

-- 5. Drop admin function if it exists
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS admin_bypass();

-- 6. Create simple admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        CASE 
            WHEN raw_user_meta_data->>'role' = 'admin' THEN true
            WHEN raw_user_meta_data->>'user_role' = 'admin' THEN true
            ELSE false
        END
    FROM auth.users 
    WHERE id = auth.uid()
$$;

-- 7. Create user policies (regular users only see their own)
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create admin policies (using the function)
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (is_admin());

-- 9. Create super-admin policy for all operations
CREATE POLICY "Super admin bypass all" ON kyc_verifications
    FOR ALL USING (is_admin());

-- 10. Ensure RLS is enabled
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 11. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kyc_verifications TO authenticated;
GRANT ALL ON kyc_verifications TO service_role;
GRANT SELECT ON auth.users TO authenticated;

-- 12. Test admin access
SELECT 
    'Test after fix' as test_name,
    COUNT(*) as count,
    'Should show all 294 records' as note
FROM kyc_verifications;

-- 13. Verify policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'kyc_verifications'
ORDER BY policyname;

-- 14. Test admin function
SELECT is_admin() as admin_check;

-- 15. If still not working, disable RLS temporarily
-- Uncomment and run this ONLY if the above doesn't work:

/*
ALTER TABLE kyc_verifications DISABLE ROW LEVEL SECURITY;

-- Test without RLS
SELECT 
    'Test without RLS' as test,
    COUNT(*) as count
FROM kyc_verifications;

-- Re-enable after testing
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
*/
