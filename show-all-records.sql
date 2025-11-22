-- SHOW ALL RECORDS - Debug why only 9 showing
-- Run this in Supabase SQL Editor

-- 1. Check total records in database
SELECT 
    'Total KYC Records' as info,
    COUNT(*) as total_count
FROM kyc_verifications;

-- 2. Check admin function output
SELECT 
    'Admin Function Count' as info,
    COUNT(*) as admin_function_count
FROM admin_get_all_kyc();

-- 3. Show which records are being filtered out
SELECT 
    'Records NOT in admin function' as info,
    COUNT(*) as filtered_count
FROM kyc_verifications k
WHERE NOT EXISTS (
    SELECT 1 FROM admin_get_all_kyc() af 
    WHERE af.id = k.id
);

-- 4. Check if admin function is working correctly
SELECT 
    'Admin Status Check' as info,
    auth.uid() as current_user,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'user_role' as user_role,
    CASE 
        WHEN raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin' 
        THEN 'Admin Access Granted' 
        ELSE 'Admin Access Denied' 
    END as access_status
FROM auth.users 
WHERE id = auth.uid();

-- 5. If still not showing all, try this improved admin function
CREATE OR REPLACE FUNCTION admin_get_all_kyc_improved()
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
    -- Return all KYC records for admins, own records for users
    SELECT 
        k.id,
        k.user_id,
        k.full_name,
        k.phone,
        k.status,
        k.created_at
    FROM kyc_verifications k
    WHERE 
        -- Admin can see all records
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
        OR
        -- Users can see their own records
        k.user_id = auth.uid()
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_get_all_kyc_improved TO authenticated;

-- Test improved function
SELECT COUNT(*) as improved_function_count FROM admin_get_all_kyc_improved();
