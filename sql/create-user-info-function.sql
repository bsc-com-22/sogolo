-- Create function to get user info for KYC records
-- Run this in Supabase SQL Editor

-- Create function to get user info (admin can access any user)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_info TO service_role;

-- Test the function
SELECT * FROM get_user_info('cb40edfd-5751-40ec-8887-24fc0e460e8c');
