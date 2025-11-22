-- FIXED ADMIN POLICIES - Handles Dependencies Correctly
-- Run this in Supabase SQL Editor

-- 1. First, let's check what's in the auth.users table for your admin
SELECT email, raw_user_meta_data, id 
FROM auth.users 
WHERE email = 'chidaziblessings@gmail.com';

-- 2. Drop policies first (before dropping the function)
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can insert KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Super admin bypass" ON kyc_verifications;

-- 3. Now drop the function (no dependencies remain)
DROP FUNCTION IF EXISTS is_admin();

-- 4. Recreate the admin function with better error handling
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- 5. Completely reset RLS policies
ALTER TABLE kyc_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 6. Create user policies (for regular users)
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC" ON kyc_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create admin policies (using direct check instead of function)
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

CREATE POLICY "Admins can insert KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- 8. Alternative: Create a super-admin policy that bypasses RLS for admins
CREATE POLICY "Super admin bypass" ON kyc_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- 9. Grant all necessary permissions
GRANT SELECT ON kyc_verifications TO authenticated;
GRANT INSERT ON kyc_verifications TO authenticated;
GRANT UPDATE ON kyc_verifications TO authenticated;
GRANT DELETE ON kyc_verifications TO authenticated;

GRANT ALL ON kyc_verifications TO service_role;

-- 10. Also grant permissions on auth.users for the admin function
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO service_role;

-- 11. Test the admin function manually
SELECT is_admin() as admin_check;

-- 12. Test current user permissions
SELECT 
    auth.uid() as current_user_id,
    is_admin() as is_admin_check,
    (raw_user_meta_data->>'role') as user_role
FROM auth.users 
WHERE id = auth.uid();

-- 13. Verify policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'kyc_verifications'
ORDER BY policyname;

-- 14. Test query to confirm access
SELECT * FROM kyc_verifications LIMIT 5;
