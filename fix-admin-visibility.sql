-- FIX ADMIN VISIBILITY - Ensure Admins Can See All KYC Data
-- Run this in Supabase SQL Editor

-- 1. First, let's see what KYC data exists
SELECT 
    'All KYC Records' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM kyc_verifications;

-- 2. Show all KYC records with user info
SELECT 
    k.id,
    k.full_name,
    k.phone,
    k.status,
    k.created_at,
    u.email as user_email,
    u.raw_user_meta_data->>'role' as user_role
FROM kyc_verifications k
LEFT JOIN auth.users u ON k.user_id = u.id
ORDER BY k.created_at DESC
LIMIT 10;

-- 3. Check current admin user
SELECT 
    auth.uid() as current_admin_id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'user_role' as user_role
FROM auth.users 
WHERE id = auth.uid();

-- 4. Disable RLS temporarily to test if that's the issue
ALTER TABLE kyc_verifications DISABLE ROW LEVEL SECURITY;

-- 5. Test query without RLS
SELECT 
    'Query without RLS' as test,
    COUNT(*) as count
FROM kyc_verifications;

-- 6. Re-enable RLS with new comprehensive policies
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 7. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can insert KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Super admin bypass" ON kyc_verifications;

-- 8. Create user policies (regular users only see their own)
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create admin policies with multiple checks (more robust)
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        -- Check multiple admin role indicators
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'user_role' = 'admin'
            OR raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'user_role' = 'admin'
            OR raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE POLICY "Admins can insert KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'user_role' = 'admin'
            OR raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- 10. Create a super-admin policy that bypasses all checks for admins
CREATE POLICY "Super admin bypass all" ON kyc_verifications
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'user_role' = 'admin'
            OR raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- 11. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kyc_verifications TO authenticated;
GRANT ALL ON kyc_verifications TO service_role;

-- 12. Grant permissions on auth.users for admin checks
GRANT SELECT ON auth.users TO authenticated;

-- 13. Test admin access with new policies
SELECT 
    'Test with new policies' as test,
    COUNT(*) as count,
    'Should show all KYC records for admin' as note
FROM kyc_verifications;

-- 14. Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'kyc_verifications'
ORDER BY policyname;

-- 15. Test specific admin query (what dashboard uses)
SELECT 
    'Admin dashboard query test' as test_type,
    COUNT(*) as total_records
FROM kyc_verifications;

-- 16. If still not working, try this emergency fix
-- (Run only if above doesn't work)

/*
-- EMERGENCY: Create admin bypass function
CREATE OR REPLACE FUNCTION admin_bypass()
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

-- Create emergency policy
DROP POLICY IF EXISTS "Emergency admin access" ON kyc_verifications;
CREATE POLICY "Emergency admin access" ON kyc_verifications
    FOR ALL USING (admin_bypass());
*/
