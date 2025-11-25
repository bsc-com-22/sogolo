-- SIMPLE ADMIN FIX - Handle Existing Policies
-- Run this in Supabase SQL Editor

-- 1. First, create the user info function (this should work)
CREATE OR REPLACE FUNCTION get_user_info(user_id UUID)
RETURNS TABLE (
    email TEXT,
    raw_user_meta_data JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        u.email,
        u.raw_user_meta_data
    FROM auth.users u
    WHERE u.id = get_user_info.user_id
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_info TO service_role;

-- 2. Test the function
SELECT * FROM get_user_info('cb40edfd-5751-40ec-8887-24fc0e460e8c');

-- 3. Check current KYC data count
SELECT 
    'Current KYC Records' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM kyc_verifications;

-- 4. Check your admin status
SELECT 
    auth.uid() as current_admin_id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'user_role' as user_role
FROM auth.users 
WHERE id = auth.uid();

-- 5. If you're still not seeing all records, disable RLS temporarily
-- Uncomment and run this ONLY if needed:

/*
ALTER TABLE kyc_verifications DISABLE ROW LEVEL SECURITY;

-- Test without RLS (should show all 294 records)
SELECT COUNT(*) as count_without_rls FROM kyc_verifications;

-- Re-enable RLS after testing
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
*/

-- 6. Alternative: Use service role for admin access
-- Create a function that bypasses RLS for admins
CREATE OR REPLACE FUNCTION admin_get_all_kyc()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    phone TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Check if current user is admin
    SELECT 
        k.id,
        k.user_id,
        k.full_name,
        k.phone,
        k.status,
        k.created_at
    FROM kyc_verifications k
    WHERE EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = id 
        AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
    )
    OR (
        -- Allow users to see their own records
        k.user_id = auth.uid()
    )
$$;

-- Grant permissions for admin function
GRANT EXECUTE ON FUNCTION admin_get_all_kyc TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_kyc TO service_role;

-- 7. Test the admin function
SELECT * FROM admin_get_all_kyc() LIMIT 5;

-- 8. Count all records using admin function
SELECT COUNT(*) as admin_function_count FROM admin_get_all_kyc();
