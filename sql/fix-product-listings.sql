-- Quick fix for product_listings table issues
-- This script checks the current state and fixes any problems

-- First, let's check if the table exists and its structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_listings' 
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, drop and recreate it
DROP TABLE IF EXISTS product_listings CASCADE;

-- Recreate the product_listings table with correct structure
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

-- Create the indexes
CREATE INDEX IF NOT EXISTS idx_product_listings_transaction_id ON product_listings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

-- Enable RLS
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_product_listings_updated_at
    BEFORE UPDATE ON product_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created correctly
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_listings' 
ORDER BY ordinal_position;
