-- Admin Access Policies for KYC Management
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;

-- 2. Create comprehensive RLS policies for KYC verifications table

-- Policy: Users can only view their own KYC submissions
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policy: Users can only insert their own KYC submissions
CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can only update their own KYC submissions (limited fields)
CREATE POLICY "Users can update own KYC" ON kyc_verifications
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id AND
        -- Users can only update certain fields, not status or review fields
        (phone IS NOT NULL OR address IS NOT NULL OR district IS NOT NULL OR
         national_id IS NOT NULL OR kin_name IS NOT NULL OR kin_relationship IS NOT NULL OR
         kin_phone IS NOT NULL OR kin_address IS NOT NULL)
    );

-- Policy: Admins can view all KYC submissions
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- Policy: Admins can update all KYC submissions (including status)
CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- Policy: Admins can insert KYC submissions (for testing/manual creation)
CREATE POLICY "Admins can insert KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- 3. Enable RLS on the table (if not already enabled)
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON kyc_verifications TO authenticated;
GRANT USAGE ON kyc_verifications TO authenticated;

-- 5. Grant admin permissions to service role (for admin operations)
GRANT ALL ON kyc_verifications TO service_role;

-- 6. Create a function to check if user is admin (for easier policy management)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = id 
        AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Alternative simpler policies using the admin function
-- (You can use these instead of the policies above if preferred)

-- Drop and recreate with simpler logic
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;

CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (is_admin());

-- 8. Test the policies
-- You can test with these queries:

-- Test as admin (should work):
-- SELECT * FROM kyc_verifications LIMIT 10;

-- Test as regular user (should only show their own records):
-- SELECT * FROM kyc_verifications WHERE user_id = 'your-user-id';

-- 9. Additional helpful policies for other tables if needed

-- If you have a users table with profile info:
/*
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
*/

-- 10. Verify current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'kyc_verifications';
