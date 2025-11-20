# Supabase Integration Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - Name: Sogolo
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" 
4. Copy your:
   - Project URL
   - Anon/Public key

## 3. Update Configuration

1. Open `js/supabase-config.js`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Anon key

Example:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## 4. Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor:

### User Profiles Table
```sql
-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### Transactions Table
```sql
-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES auth.users(id),
    seller_id UUID REFERENCES auth.users(id),
    product_name TEXT NOT NULL,
    product_description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'completed', 'cancelled', 'disputed')),
    verification_link TEXT,
    payment_method TEXT,
    escrow_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

### KYC Submissions Table
```sql
-- Create KYC submissions table
CREATE TABLE kyc_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 5. Set Up Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create these buckets:
   - `avatars` (for user profile pictures)
   - `documents` (for KYC documents)
   - `product-images` (for transaction product images)

3. Set up bucket policies for each:

### Avatars Bucket Policy
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view avatars
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 6. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs for OAuth providers if using Google/GitHub login
4. Enable email confirmations if desired

## 7. Optional: Set Up OAuth Providers

### Google OAuth
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Add authorized redirect URIs

### GitHub OAuth
1. Enable GitHub provider
2. Add your GitHub OAuth app credentials

## 8. Test the Integration

1. Open your `signin.html` page
2. Try creating a new account
3. Check your Supabase dashboard to see if the user was created
4. Test the login functionality

## 9. Environment Variables (Optional)

For production, consider using environment variables:

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-fallback-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-fallback-key';
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your site URL is configured in Supabase settings
2. **RLS Errors**: Ensure Row Level Security policies are set up correctly
3. **Auth Errors**: Check that your Supabase URL and keys are correct
4. **Email Not Sending**: Configure SMTP settings in Supabase Auth settings

### Debug Mode:

Add this to your browser console to enable debug logging:
```javascript
localStorage.setItem('supabase.auth.debug', 'true');
```

## Next Steps

1. Customize the user profile fields as needed
2. Add more transaction statuses and workflow
3. Implement email templates for notifications
4. Add webhook endpoints for payment processing
5. Set up monitoring and analytics

## Security Best Practices

1. Always use Row Level Security (RLS)
2. Validate data on both client and server side
3. Use HTTPS in production
4. Regularly rotate your service role key
5. Monitor authentication logs
6. Implement rate limiting for sensitive operations
