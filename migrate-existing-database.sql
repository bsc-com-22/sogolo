-- =====================================================
-- DATABASE MIGRATION SCRIPT
-- Adapts existing schema to work with Sogolo application
-- =====================================================

-- =====================================================
-- 1. ANALYZE CURRENT STRUCTURE
-- =====================================================

-- Check current tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'transactions', 'kyc_verifications', 'product_listings', 
        'product_images', 'payment_records', 'escrow_records',
        'inspection_records', 'transaction_history', 'notifications', 'user_profiles'
    )
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 2. UPDATE EXISTING TABLES TO MATCH APPLICATION REQUIREMENTS
-- =====================================================

-- Update transactions table to add missing columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shareable_link TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status values to match application
UPDATE transactions 
SET status = 'created' 
WHERE status = 'pending';

-- Add transaction_id for existing records
UPDATE transactions 
SET transaction_id = 'SGL-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(row_number() OVER (ORDER BY created_at)::TEXT, 5, '0')
WHERE transaction_id IS NULL;

-- Add shareable links for existing records
UPDATE transactions 
SET shareable_link = 'https://sogolo.com/transaction.html?id=' || transaction_id
WHERE shareable_link IS NULL AND transaction_id IS NOT NULL;

-- Update kyc_verifications table to add missing columns
ALTER TABLE kyc_verifications 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS address_document_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update KYC status values to match application
UPDATE kyc_verifications 
SET status = CASE 
    WHEN status = 'verified' THEN 'approved'
    WHEN status = 'rejected' THEN 'rejected'
    ELSE 'pending'
END;

-- Update payment_records table to add missing columns
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MWK',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update escrow_records table to add missing columns
ALTER TABLE escrow_records 
ADD COLUMN IF NOT EXISTS refunded_by UUID,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS funds_refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update inspection_records table to add missing columns
ALTER TABLE inspection_records 
ADD COLUMN IF NOT EXISTS inspection_photos_url TEXT,
ADD COLUMN IF NOT EXISTS missing_items TEXT,
ADD COLUMN IF NOT EXISTS damages_found TEXT,
ADD COLUMN IF NOT EXISTS condition_notes TEXT,
ADD COLUMN IF NOT EXISTS actual_condition TEXT CHECK (actual_condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update notifications table to add missing columns
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update product_listings table to add missing columns
ALTER TABLE product_listings 
ADD COLUMN IF NOT EXISTS product_color TEXT,
ADD COLUMN IF NOT EXISTS product_size TEXT,
ADD COLUMN IF NOT EXISTS product_weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS product_dimensions TEXT,
ADD COLUMN IF NOT EXISTS minimum_acceptable_price DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- =====================================================
-- 3. CREATE MISSING INDEXES
-- =====================================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shareable_link ON transactions(shareable_link);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- KYC indexes
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

-- Product listings indexes
CREATE INDEX IF NOT EXISTS idx_product_listings_transaction_id ON product_listings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_listing_id ON product_images(product_listing_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(image_order);

-- Payment records indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_transaction_id ON payment_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- Escrow records indexes
CREATE INDEX IF NOT EXISTS idx_escrow_records_transaction_id ON escrow_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_records_status ON escrow_records(status);

-- Inspection records indexes
CREATE INDEX IF NOT EXISTS idx_inspection_records_transaction_id ON inspection_records(transaction_id);

-- Transaction history indexes
CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created_at ON transaction_history(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- =====================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on tables that have this column
DO $$
BEGIN
    -- Transactions trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
        CREATE TRIGGER update_transactions_updated_at
            BEFORE UPDATE ON transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- KYC verifications trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_verifications' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_kyc_verifications_updated_at ON kyc_verifications;
        CREATE TRIGGER update_kyc_verifications_updated_at
            BEFORE UPDATE ON kyc_verifications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Product listings trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_listings' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_product_listings_updated_at ON product_listings;
        CREATE TRIGGER update_product_listings_updated_at
            BEFORE UPDATE ON product_listings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Payment records trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_records' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
        CREATE TRIGGER update_payment_records_updated_at
            BEFORE UPDATE ON payment_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Escrow records trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_records' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_escrow_records_updated_at ON escrow_records;
        CREATE TRIGGER update_escrow_records_updated_at
            BEFORE UPDATE ON escrow_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Inspection records trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_records' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_inspection_records_updated_at ON inspection_records;
        CREATE TRIGGER update_inspection_records_updated_at
            BEFORE UPDATE ON inspection_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- User profiles trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    year_part TEXT;
    sequence_part TEXT;
    base_id TEXT;
BEGIN
    -- Get current year
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Create base ID
    base_id := 'SGL-' || year_part || '-';
    
    -- Find the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_id, LENGTH(base_id) + 1) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM transactions
    WHERE transaction_id LIKE base_id || '%';
    
    -- Format with leading zeros
    new_id := base_id || LPAD(sequence_part::TEXT, 5, '0');
    
    RETURN new_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback to timestamp-based ID
        RETURN 'SGL-' || year_part || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to log transaction history
CREATE OR REPLACE FUNCTION log_transaction_history(
    p_transaction_id UUID,
    p_event_type TEXT,
    p_event_description TEXT,
    p_previous_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO transaction_history (
        transaction_id,
        event_type,
        event_description,
        previous_status,
        new_status,
        performed_by,
        user_role
    ) VALUES (
        p_transaction_id,
        p_event_type,
        p_event_description,
        p_previous_status,
        p_new_status,
        p_performed_by,
        p_user_role
    ) RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE VIEWS FOR APPLICATION COMPATIBILITY
-- =====================================================

-- Transaction Summary View (adapted to existing schema)
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.transaction_id,
    COALESCE(t.title, t.product_name) as title,
    COALESCE(t.description, t.product_description) as description,
    t.amount,
    t.currency,
    t.status,
    t.created_at,
    t.updated_at,
    t.completed_at,
    t.shareable_link,
    
    -- Buyer info
    COALESCE(up_buyer.full_name, buyer.email) as buyer_name,
    buyer.email as buyer_email,
    
    -- Seller info
    COALESCE(up_seller.full_name, seller.email) as seller_name,
    seller.email as seller_email,
    
    -- Product info
    pl.product_name,
    pl.product_description,
    
    -- Latest event
    (SELECT event_description FROM transaction_history 
     WHERE transaction_id = t.id 
     ORDER BY created_at DESC LIMIT 1) as latest_event
    
FROM transactions t
LEFT JOIN auth.users buyer ON t.buyer_id = buyer.id
LEFT JOIN auth.users seller ON t.seller_id = seller.id
LEFT JOIN user_profiles up_buyer ON t.buyer_id = up_buyer.id
LEFT JOIN user_profiles up_seller ON t.seller_id = up_seller.id
LEFT JOIN product_listings pl ON t.id = pl.transaction_id;

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS) IF NOT ENABLED
-- =====================================================

DO $$
BEGIN
    -- Enable RLS on all tables
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions' AND rowsecurity = true) THEN
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'kyc_verifications' AND rowsecurity = true) THEN
        ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_listings' AND rowsecurity = true) THEN
        ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_images' AND rowsecurity = true) THEN
        ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_records' AND rowsecurity = true) THEN
        ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'escrow_records' AND rowsecurity = true) THEN
        ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inspection_records' AND rowsecurity = true) THEN
        ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transaction_history' AND rowsecurity = true) THEN
        ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND rowsecurity = true) THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- KYC Verifications Policies
DROP POLICY IF EXISTS "Users can view their own KYC" ON kyc_verifications;
CREATE POLICY "Users can view their own KYC" ON kyc_verifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own KYC" ON kyc_verifications;
CREATE POLICY "Users can update their own KYC" ON kyc_verifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own KYC" ON kyc_verifications;
CREATE POLICY "Users can insert their own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage all KYC" ON kyc_verifications;
CREATE POLICY "Admins can manage all KYC" ON kyc_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can update transactions" ON transactions;
CREATE POLICY "Sellers can update transactions" ON transactions
    FOR UPDATE USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;
CREATE POLICY "Admins can manage all transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Product Listings Policies
DROP POLICY IF EXISTS "Users can view product listings for their transactions" ON product_listings;
CREATE POLICY "Users can view product listings for their transactions" ON product_listings
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Sellers can manage product listings" ON product_listings;
CREATE POLICY "Sellers can manage product listings" ON product_listings
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all product listings" ON product_listings;
CREATE POLICY "Admins can manage all product listings" ON product_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Verify all tables have the required columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'transactions', 'kyc_verifications', 'product_listings', 
        'product_images', 'payment_records', 'escrow_records',
        'inspection_records', 'transaction_history', 'notifications', 'user_profiles'
    )
    AND column_name IN ('transaction_id', 'title', 'description', 'shareable_link', 'updated_at')
ORDER BY table_name, column_name;

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN (
        'transactions', 'kyc_verifications', 'product_listings', 
        'product_images', 'payment_records', 'escrow_records',
        'inspection_records', 'transaction_history', 'notifications', 'user_profiles'
    )
ORDER BY tablename, indexname;

-- Verify view was created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'transaction_summary';

RAISE NOTICE 'Database migration completed successfully!';
