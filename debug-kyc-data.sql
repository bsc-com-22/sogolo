-- DEBUG KYC DATA - Check if KYC submissions exist
-- Run this in Supabase SQL Editor

-- 1. Check if kyc_verifications table exists and has data
SELECT 
    'Table exists and has ' || COUNT(*) || ' records' as status
FROM kyc_verifications;

-- 2. Show all KYC records with details
SELECT 
    id,
    user_id,
    full_name,
    phone,
    status,
    created_at,
    reviewed_at,
    reviewed_by
FROM kyc_verifications
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if there are any KYC submissions at all
SELECT 
    COUNT(*) as total_kyc,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM kyc_verifications;

-- 4. Check if there are any users who might have submitted KYC
SELECT 
    u.email,
    u.raw_user_meta_data,
    k.id as kyc_id,
    k.status,
    k.created_at
FROM auth.users u
LEFT JOIN kyc_verifications k ON u.id = k.user_id
WHERE u.raw_user_meta_data->>'role' != 'admin' OR u.raw_user_meta_data->>'role' IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Create test KYC data if none exists (for testing)
INSERT INTO kyc_verifications (
    id,
    user_id,
    full_name,
    phone,
    date_of_birth,
    address,
    district,
    national_id,
    kin_name,
    kin_relationship,
    kin_phone,
    kin_address,
    consent_data,
    consent_terms,
    consent_accuracy,
    status,
    created_at
) 
SELECT 
    gen_random_uuid(),
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Test User'),
    '+265999888777',
    '1990-01-01',
    'Test Address, Area 25',
    'Lilongwe',
    'TEST123456',
    'John Kin',
    'Brother',
    '+265999888888',
    'Kin Address',
    true,
    true,
    true,
    'pending',
    NOW()
FROM auth.users u
WHERE u.email = 'chidaziblessings@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM kyc_verifications k 
    WHERE k.user_id = u.id
)
LIMIT 1;

-- 6. Verify the test data was created
SELECT 
    'Test KYC created' as status,
    full_name,
    phone,
    status,
    created_at
FROM kyc_verifications
WHERE user_id = (
    SELECT id FROM auth_users WHERE email = 'chidaziblessings@gmail.com'
);

-- 7. Check current RLS policies
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

-- 8. Test admin access
SELECT 
    auth.uid() as current_user_id,
    raw_user_meta_data->>'role' as user_role,
    is_admin() as is_admin_check
FROM auth.users 
WHERE id = auth.uid();

-- 9. Test direct query (what admin dashboard runs)
SELECT 
    COUNT(*) as count,
    'Direct query test' as test_type
FROM kyc_verifications;

-- 10. Test the exact query the admin dashboard uses
SELECT *
FROM kyc_verifications
ORDER BY created_at DESC
LIMIT 10;
