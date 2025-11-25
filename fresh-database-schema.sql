-- =====================================================
-- SOGOLO DATABASE SCHEMA - FRESH START
-- =====================================================
-- This script drops all existing tables and recreates everything cleanly

-- =====================================================
-- 1. DROP ALL EXISTING TABLES (in correct order to avoid conflicts)
-- =====================================================

-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS inspection_records CASCADE;
DROP TABLE IF EXISTS escrow_records CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_listings CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS kyc_verifications CASCADE;

-- =====================================================
-- 2. CREATE TABLES FROM SCRATCH
-- =====================================================

-- KYC Verifications Table
CREATE TABLE kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Personal Information
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Verification Documents
    id_document_url TEXT,
    address_document_url TEXT,
    selfie_url TEXT,
    
    -- Status and Review
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'skipped')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Transaction Details
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    
    -- Status Management
    status TEXT DEFAULT 'created' CHECK (
        status IN (
            'created', 'seller_joined', 'product_submitted', 'product_approved', 
            'payment_uploaded', 'payment_verified', 'funds_received', 
            'product_delivered', 'inspection_passed', 'funds_released', 
            'completed', 'cancelled', 'disputed'
        )
    ),
    
    -- Dates
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Shareable Link
    shareable_link TEXT UNIQUE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Listings Table
CREATE TABLE product_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Product Details
    product_name TEXT NOT NULL,
    product_description TEXT NOT NULL,
    product_category TEXT,
    product_condition TEXT CHECK (product_condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    product_brand TEXT,
    product_model TEXT,
    product_color TEXT,
    product_size TEXT,
    product_weight DECIMAL(8,2),
    product_dimensions TEXT,
    
    -- Pricing
    expected_price DECIMAL(12,2) NOT NULL,
    minimum_acceptable_price DECIMAL(12,2),
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    
    -- Submission Details
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Images Table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_listing_id UUID REFERENCES product_listings(id) ON DELETE CASCADE NOT NULL,
    
    -- Image Details
    image_url TEXT NOT NULL,
    image_order INTEGER DEFAULT 0,
    file_size INTEGER,
    file_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Records Table
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_provider TEXT,
    transaction_reference TEXT,
    
    -- Status
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
    
    -- Verification
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Payment Proof
    proof_url TEXT,
    proof_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrow Records Table
CREATE TABLE escrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Escrow Details
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Status
    status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    
    -- Fund Management
    funds_held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    funds_released_at TIMESTAMP WITH TIME ZONE,
    funds_refunded_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES auth.users(id),
    refunded_by UUID REFERENCES auth.users(id),
    
    -- Notes
    release_notes TEXT,
    refund_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection Records Table
CREATE TABLE inspection_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Inspection Details
    inspector_id UUID REFERENCES auth.users(id) NOT NULL,
    result TEXT CHECK (result IN ('passed', 'failed', 'pending')),
    inspection_notes TEXT,
    
    -- Images
    inspection_images TEXT[], -- Array of image URLs
    
    -- Timestamps
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction History Table
CREATE TABLE transaction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Event Details
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    
    -- Who performed the action
    performed_by UUID REFERENCES auth.users(id),
    user_role TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification Details
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    -- Related Entity
    related_entity_type TEXT,
    related_entity_id UUID,
    
    -- Status
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- KYC Verifications
CREATE INDEX idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);

-- Transactions
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Product Listings
CREATE INDEX idx_product_listings_transaction_id ON product_listings(transaction_id);
CREATE INDEX idx_product_listings_status ON product_listings(status);

-- Product Images
CREATE INDEX idx_product_images_product_listing_id ON product_images(product_listing_id);
CREATE INDEX idx_product_images_order ON product_images(image_order);

-- Payment Records
CREATE INDEX idx_payment_records_transaction_id ON payment_records(transaction_id);
CREATE INDEX idx_payment_records_status ON payment_records(status);

-- Escrow Records
CREATE INDEX idx_escrow_records_transaction_id ON escrow_records(transaction_id);
CREATE INDEX idx_escrow_records_status ON escrow_records(status);

-- Inspection Records
CREATE INDEX idx_inspection_records_transaction_id ON inspection_records(transaction_id);

-- Transaction History
CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_created_at ON transaction_history(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

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

-- Create triggers for updated_at
CREATE TRIGGER update_kyc_verifications_updated_at
    BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_listings_updated_at
    BEFORE UPDATE ON product_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
    BEFORE UPDATE ON payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_records_updated_at
    BEFORE UPDATE ON escrow_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_records_updated_at
    BEFORE UPDATE ON inspection_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- KYC Verifications Policies
CREATE POLICY "Users can view their own KYC" ON kyc_verifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own KYC" ON kyc_verifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all KYC" ON kyc_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Transactions Policies
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update transactions" ON transactions
    FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage all transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Product Listings Policies
CREATE POLICY "Users can view product listings for their transactions" ON product_listings
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can manage product listings" ON product_listings
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all product listings" ON product_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Product Images Policies
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

CREATE POLICY "Admins can manage all product images" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Payment Records Policies
CREATE POLICY "Users can view payment records for their transactions" ON payment_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

CREATE POLICY "Buyers can upload payment proofs" ON payment_records
    FOR INSERT WITH CHECK (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all payment records" ON payment_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Escrow Records Policies
CREATE POLICY "Users can view escrow for their transactions" ON escrow_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all escrow records" ON escrow_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Inspection Records Policies
CREATE POLICY "Users can view inspection records for their transactions" ON inspection_records
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all inspection records" ON inspection_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Transaction History Policies
CREATE POLICY "Users can view history for their transactions" ON transaction_history
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions 
            WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all transaction history" ON transaction_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- Transaction Summary View
CREATE VIEW transaction_summary AS
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
    buyer.email as buyer_email,
    buyer.raw_user_meta_data->>'full_name' as buyer_name,
    
    -- Seller info
    seller.email as seller_email,
    seller.raw_user_meta_data->>'full_name' as seller_name,
    
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
LEFT JOIN product_listings pl ON t.id = pl.transaction_id;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Verify all tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'kyc_verifications', 'transactions', 'product_listings', 
        'product_images', 'payment_records', 'escrow_records',
        'inspection_records', 'transaction_history', 'notifications'
    )
ORDER BY table_name, ordinal_position;

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN (
        'kyc_verifications', 'transactions', 'product_listings', 
        'product_images', 'payment_records', 'escrow_records',
        'inspection_records', 'transaction_history', 'notifications'
    )
ORDER BY tablename, indexname;

RAISE NOTICE 'Database schema created successfully!';
