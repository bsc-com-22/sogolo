-- MINIMAL ADMIN FIX - Clean Version
-- Run this in Supabase SQL Editor (clear the editor first)

-- 1. Create user info function
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

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_info TO service_role;

-- 3. Test user info function
SELECT * FROM get_user_info('cb40edfd-5751-40ec-8887-24fc0e460e8c');

-- 4. Create admin function to bypass RLS
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

-- 5. Grant permissions for admin function
GRANT EXECUTE ON FUNCTION admin_get_all_kyc TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_kyc TO service_role;

-- 6. Test admin function
SELECT COUNT(*) as total_records FROM admin_get_all_kyc();

-- 7. Show sample records
SELECT * FROM admin_get_all_kyc() LIMIT 5;

-- 8. Check admin status
SELECT 
    auth.uid() as current_admin_id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'user_role' as user_role
FROM auth.users 
WHERE id = auth.uid();
