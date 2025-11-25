-- QUICK FIX: Grant Admin Access to KYC Table
-- Run this in Supabase SQL Editor immediately

-- 1. Enable RLS if not already enabled
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 2. Create admin check function
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

-- 3. Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;

-- 4. Create user policies
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC" ON kyc_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create admin policies
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (is_admin());

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE ON kyc_verifications TO authenticated;
GRANT ALL ON kyc_verifications TO service_role;

-- 7. Verify your admin role
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'chidaziblessings@gmail.com';

-- 8. Test query (should work after running this)
-- SELECT * FROM kyc_verifications LIMIT 5;
