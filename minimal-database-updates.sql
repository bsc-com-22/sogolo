-- =====================================================
-- MINIMAL DATABASE UPDATES FOR SOGOLO APPLICATION
-- Updates existing schema to be fully compatible
-- =====================================================

-- =====================================================
-- 1. ADD MISSING INDEXES
-- =====================================================

-- Transactions indexes (add missing ones)
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_shareable_link ON transactions(shareable_link);

-- KYC Verifications indexes
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

-- Product Listings indexes
CREATE INDEX IF NOT EXISTS idx_product_listings_transaction_id ON product_listings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

-- Product Images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_listing_id ON product_images(product_listing_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(image_order);

-- Payment Records indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_transaction_id ON payment_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- Escrow Records indexes
CREATE INDEX IF NOT EXISTS idx_escrow_records_transaction_id ON escrow_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_records_status ON escrow_records(status);

-- Inspection Records indexes
CREATE INDEX IF NOT EXISTS idx_inspection_records_transaction_id ON inspection_records(transaction_id);

-- Transaction History indexes
CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created_at ON transaction_history(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- User Profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- =====================================================
-- 2. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables that have this column
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
-- 3. CREATE TRANSACTION SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.transaction_id,
    t.title,
    t.description,
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
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
    -- Enable RLS on all tables if not already enabled
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
-- 5. CREATE RLS POLICIES
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

-- Product Images Policies
DROP POLICY IF EXISTS "Users can view product images for their transactions" ON product_images;
CREATE POLICY "Users can view product images for their transactions" ON product_images
    FOR SELECT USING (
        product_listing_id IN (
            SELECT id FROM product_listings 
            WHERE transaction_id IN (
                SELECT id FROM transactions 
                WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Sellers can manage product images" ON product_images;
CREATE POLICY "Sellers can manage product images" ON product_images
    FOR ALL USING (
        product_listing_id IN (
            SELECT id FROM product_listings 
            WHERE transaction_id IN (
                SELECT id FROM transactions 
                WHERE seller_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Admins can manage all product images" ON product_images;
CREATE POLICY "Admins can manage all product images" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Payment Records Policies
DROP POLICY IF EXISTS "Users can view payment records for their transactions" ON payment_records;
CREATE POLICY "Users can view payment records for their transactions" ON payment_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Buyers can upload payment proofs" ON payment_records;
CREATE POLICY "Buyers can upload payment proofs" ON payment_records
    FOR INSERT WITH CHECK (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all payment records" ON payment_records;
CREATE POLICY "Admins can manage all payment records" ON payment_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Escrow Records Policies
DROP POLICY IF EXISTS "Users can view escrow for their transactions" ON escrow_records;
CREATE POLICY "Users can view escrow for their transactions" ON escrow_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all escrow records" ON escrow_records;
CREATE POLICY "Admins can manage all escrow records" ON escrow_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Inspection Records Policies
DROP POLICY IF EXISTS "Users can view inspection records for their transactions" ON inspection_records;
CREATE POLICY "Users can view inspection records for their transactions" ON inspection_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all inspection records" ON inspection_records;
CREATE POLICY "Admins can manage all inspection records" ON inspection_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Transaction History Policies
DROP POLICY IF EXISTS "Users can view history for their transactions" ON transaction_history;
CREATE POLICY "Users can view history for their transactions" ON transaction_history
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all transaction history" ON transaction_history;
CREATE POLICY "Admins can view all transaction history" ON transaction_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

-- Verify all indexes were created
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

RAISE NOTICE 'Database updates completed successfully!';
