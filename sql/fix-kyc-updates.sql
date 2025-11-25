-- FIX KYC UPDATES - Allow Admins to Update KYC Status
-- Run this in Supabase SQL Editor

-- 1. Create function to update user KYC status (optional)
CREATE OR REPLACE FUNCTION update_user_kyc_status(user_id UUID, status TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
        raw_user_meta_data, 
        '{kyc_status}', 
        to_jsonb(status)
    )
    WHERE id = update_user_kyc_status.user_id
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_kyc_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_kyc_status TO service_role;

-- 2. Test the function
SELECT update_user_kyc_status('cb40edfd-5751-40ec-8887-24fc0e460e8c', 'verified');

-- 3. Check if admin policies allow updates
SELECT 
    'Current RLS Policies for Updates' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'kyc_verifications' 
AND cmd = 'UPDATE'
ORDER BY policyname;

-- 4. If update policies are missing, create them
CREATE POLICY "Admins can update all KYC records" ON kyc_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- 5. Test admin update permission
SELECT 
    'Testing admin update permission' as test,
    auth.uid() as current_user,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin' 
        THEN 'Can Update KYC' 
        ELSE 'Cannot Update KYC' 
    END as update_permission
FROM auth.users 
WHERE id = auth.uid();

-- 6. Test actual update (this should work for admins)
UPDATE kyc_verifications 
SET status = 'verified', 
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    review_notes = 'Admin test update'
WHERE id = (
    SELECT id FROM kyc_verifications 
    WHERE status = 'pending' 
    LIMIT 1
)
AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
);

-- 7. Check if update worked
SELECT 
    'Update Test Result' as info,
    COUNT(*) as updated_records
FROM kyc_verifications 
WHERE status = 'verified' 
AND reviewed_at >= NOW() - INTERVAL '1 minute';
