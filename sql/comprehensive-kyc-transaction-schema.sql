-- COMPREHENSIVE KYC AND TRANSACTION SYSTEM DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ENHANCED KYC VERIFICATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'skipped')),
    
    -- Personal Information
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    nationality TEXT NOT NULL,
    country_of_residence TEXT NOT NULL,
    
    -- Contact Information
    phone_number TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    region TEXT,
    postal_code TEXT,
    
    -- Document Information
    id_document_type TEXT CHECK (id_document_type IN ('passport', 'national_id', 'drivers_license', 'voter_card')),
    id_document_number TEXT,
    id_document_front_url TEXT, -- Supabase storage URL
    id_document_back_url TEXT, -- Supabase storage URL
    
    -- Additional Documents
    proof_of_address_url TEXT, -- Supabase storage URL
    selfie_url TEXT, -- Supabase storage URL
    
    -- Verification Process
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL, -- Human-readable unique ID (e.g., SGL-2024-12345)
    
    -- Transaction Parties
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction Details
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'MWK',
    
    -- Transaction Status
    status TEXT NOT NULL DEFAULT 'created' CHECK (
        status IN (
            'created', 'seller_joined', 'product_submitted', 'product_approved', 
            'payment_uploaded', 'payment_verified', 'funds_received', 
            'product_delivered', 'inspection_passed', 'funds_released', 'completed',
            'cancelled', 'disputed'
        )
    ),
    
    -- Important Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    shareable_link TEXT UNIQUE,
    notes TEXT,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PRODUCT LISTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_listings (
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
    product_dimensions TEXT, -- JSON string: {"length": 10, "width": 8, "height": 5}
    
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

-- =====================================================
-- 4. PRODUCT IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_listing_id UUID REFERENCES product_listings(id) ON DELETE CASCADE NOT NULL,
    
    -- Image Details
    image_url TEXT NOT NULL, -- Supabase storage URL
    image_caption TEXT,
    image_order INTEGER NOT NULL DEFAULT 0,
    
    -- Image Metadata
    file_size INTEGER, -- in bytes
    file_type TEXT, -- e.g., 'image/jpeg', 'image/png'
    upload_ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. PAYMENT RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash', 'other')),
    payment_provider TEXT, -- e.g., 'Airtel Money', 'TNM Mpamba', 'National Bank'
    transaction_reference TEXT, -- Provider transaction reference
    
    -- Payment Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected', 'refunded')),
    
    -- Payment Proof
    proof_url TEXT, -- Supabase storage URL
    proof_description TEXT,
    
    -- Verification Details
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ESCROW RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS escrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Escrow Details
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'MWK',
    
    -- Status Tracking
    funds_held_at TIMESTAMP WITH TIME ZONE,
    funds_released_at TIMESTAMP WITH TIME ZONE,
    funds_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Release Details
    released_by UUID REFERENCES auth.users(id),
    release_notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. INSPECTION RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Inspection Details
    inspector_id UUID REFERENCES auth.users(id) NOT NULL,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inspection_location TEXT,
    
    -- Inspection Results
    result TEXT CHECK (result IN ('passed', 'failed', 'needs_revision')),
    inspection_notes TEXT,
    
    -- Condition Assessment
    actual_condition TEXT CHECK (actual_condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    condition_notes TEXT,
    missing_items TEXT,
    damages_found TEXT,
    
    -- Photos
    inspection_photos_url TEXT, -- JSON array of Supabase storage URLs
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TRANSACTION HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    
    -- Event Details
    event_type TEXT NOT NULL,
    event_description TEXT,
    previous_status TEXT,
    new_status TEXT,
    
    -- User Context
    performed_by UUID REFERENCES auth.users(id),
    user_role TEXT, -- 'buyer', 'seller', 'admin', 'system'
    
    -- Additional Data
    metadata JSONB, -- Flexible storage for event-specific data
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification Details
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    -- Related Entity
    related_entity_type TEXT, -- 'transaction', 'kyc', 'payment', etc.
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- KYC Verifications
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Product Listings
CREATE INDEX IF NOT EXISTS idx_product_listings_transaction_id ON product_listings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

-- Product Images
CREATE INDEX IF NOT EXISTS idx_product_images_product_listing_id ON product_images(product_listing_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(image_order);

-- Payment Records
CREATE INDEX IF NOT EXISTS idx_payment_records_transaction_id ON payment_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- Escrow Records
CREATE INDEX IF NOT EXISTS idx_escrow_records_transaction_id ON escrow_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_records_status ON escrow_records(status);

-- Inspection Records
CREATE INDEX IF NOT EXISTS idx_inspection_records_transaction_id ON inspection_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_inspection_records_inspector_id ON inspection_records(inspector_id);

-- Transaction History
CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created_at ON transaction_history(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 11. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id TEXT;
    year_part TEXT := EXTRACT(year FROM NOW())::TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_id FROM '-\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM transactions
    WHERE transaction_id LIKE 'SGL-' || year_part || '-%';
    
    new_id := 'SGL-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM transactions WHERE transaction_id = new_id) LOOP
        sequence_num := sequence_num + 1;
        new_id := 'SGL-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- Function to generate shareable link
CREATE OR REPLACE FUNCTION generate_shareable_link(transaction_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN 'https://sogolo.com/transaction/' || transaction_uuid::TEXT;
END;
$$;

-- Function to log transaction history
CREATE OR REPLACE FUNCTION log_transaction_history(
    p_transaction_id UUID,
    p_event_type TEXT,
    p_event_description TEXT,
    p_previous_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO transaction_history (
        transaction_id,
        event_type,
        event_description,
        previous_status,
        new_status,
        performed_by,
        user_role,
        metadata
    ) VALUES (
        p_transaction_id,
        p_event_type,
        p_event_description,
        p_previous_status,
        p_new_status,
        p_performed_by,
        p_user_role,
        p_metadata
    );
END;
$$;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
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

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- KYC Verifications Policies
CREATE POLICY "Users can view their own KYC" ON kyc_verifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC" ON kyc_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

CREATE POLICY "Admins can update all KYC" ON kyc_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- Transactions Policies
CREATE POLICY "Users can view transactions they are part of" ON transactions
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

CREATE POLICY "Users can create transactions as buyer" ON transactions
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their transactions" ON transactions
    FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admins can update all transactions" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- Product Listings Policies (similar pattern)
CREATE POLICY "Users can view product listings for their transactions" ON product_listings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions 
            WHERE transactions.id = product_listings.transaction_id 
            AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
        )
    );

CREATE POLICY "Sellers can manage product listings" ON product_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transactions 
            WHERE transactions.id = product_listings.transaction_id 
            AND transactions.seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all product listings" ON product_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'user_role' = 'admin')
        )
    );

-- Similar policies for other tables...
-- (For brevity, I'm showing the pattern - you'd create similar policies for all tables)

-- =====================================================
-- 13. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for transaction summary with all related data
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.transaction_id,
    t.title,
    t.amount,
    t.currency,
    t.status,
    t.created_at,
    t.expires_at,
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
    pl.status as product_status,
    pl.expected_price,
    
    -- Payment info
    pr.status as payment_status,
    pr.payment_method,
    pr.verified_at as payment_verified_at,
    
    -- Escrow info
    er.status as escrow_status,
    er.funds_held_at,
    er.funds_released_at,
    
    -- Inspection info
    ir.result as inspection_result,
    ir.inspection_date,
    
    -- Latest history event
    (SELECT event_description FROM transaction_history 
     WHERE transaction_id = t.id 
     ORDER BY created_at DESC LIMIT 1) as latest_event
    
FROM transactions t
LEFT JOIN auth.users buyer ON t.buyer_id = buyer.id
LEFT JOIN auth.users seller ON t.seller_id = seller.id
LEFT JOIN product_listings pl ON t.id = pl.transaction_id
LEFT JOIN payment_records pr ON t.id = pr.transaction_id
LEFT JOIN escrow_records er ON t.id = er.transaction_id
LEFT JOIN inspection_records ir ON t.id = ir.transaction_id;

-- View for user dashboard
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    t.id,
    t.transaction_id,
    t.title,
    t.amount,
    t.currency,
    t.status,
    t.created_at,
    CASE 
        WHEN t.buyer_id = auth.uid() THEN 'buyer'
        WHEN t.seller_id = auth.uid() THEN 'seller'
        ELSE 'unknown'
    END as user_role,
    
    -- Other party info
    CASE 
        WHEN t.buyer_id = auth.uid() THEN 
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = t.seller_id)
        ELSE 
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = t.buyer_id)
    END as other_party_name,
    
    -- Action required
    CASE 
        WHEN t.status = 'created' AND t.buyer_id = auth.uid() THEN 'Share link with seller'
        WHEN t.status = 'seller_joined' AND t.seller_id = auth.uid() THEN 'Add product details'
        WHEN t.status = 'product_submitted' AND t.buyer_id = auth.uid() THEN 'Review product'
        WHEN t.status = 'product_approved' AND t.buyer_id = auth.uid() THEN 'Upload payment proof'
        WHEN t.status = 'payment_uploaded' THEN 'Admin verification pending'
        WHEN t.status = 'payment_verified' AND t.seller_id = auth.uid() THEN 'Deliver product'
        WHEN t.status = 'product_delivered' THEN 'Admin inspection pending'
        ELSE NULL
    END as required_action
    
FROM transactions t
WHERE t.buyer_id = auth.uid() OR t.seller_id = auth.uid()
ORDER BY t.created_at DESC;

-- =====================================================
-- 14. SAMPLE DATA INSERTION (Optional)
-- =====================================================

-- You can uncomment this section to create sample data for testing

-- INSERT INTO kyc_verifications (user_id, full_name, nationality, country_of_residence, status)
-- SELECT 
--     id,
--     'Test User',
--     'Malawian',
--     'Malawi',
--     'skipped'
-- FROM auth.users 
-- LIMIT 1;

-- =====================================================
-- 15. STORAGE BUCKETS SETUP
-- =====================================================

-- Create storage buckets (run these in Supabase Storage section)
-- 1. kyc-documents - For KYC uploads
-- 2. product-images - For product photos
-- 3. payment-proofs - For payment proof images
-- 4. inspection-photos - For inspection photos

-- Example storage policies would need to be created separately

COMMIT;
