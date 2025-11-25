-- =====================================================
-- QUICK FIX FOR KYC CONSENT FIELDS
-- Ensures all required consent fields exist in kyc_verifications table
-- =====================================================

-- Check if consent fields exist, add them if missing
DO $$
BEGIN
    -- Add consent_data if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'consent_data'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN consent_data BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added consent_data column';
    END IF;
    
    -- Add consent_terms if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'consent_terms'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN consent_terms BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added consent_terms column';
    END IF;
    
    -- Add consent_accuracy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'consent_accuracy'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN consent_accuracy BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added consent_accuracy column';
    END IF;
    
    -- Add other fields that might be missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'district'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN district TEXT;
        RAISE NOTICE 'Added district column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'national_id'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN national_id TEXT;
        RAISE NOTICE 'Added national_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'kin_name'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN kin_name TEXT;
        RAISE NOTICE 'Added kin_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'kin_relationship'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN kin_relationship TEXT;
        RAISE NOTICE 'Added kin_relationship column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'kin_phone'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN kin_phone TEXT;
        RAISE NOTICE 'Added kin_phone column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'kin_address'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN kin_address TEXT;
        RAISE NOTICE 'Added kin_address column';
    END IF;
    
    -- Add document URL fields if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'id_document_url'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN id_document_url TEXT;
        RAISE NOTICE 'Added id_document_url column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'address_document_url'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN address_document_url TEXT;
        RAISE NOTICE 'Added address_document_url column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'selfie_url'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN selfie_url TEXT;
        RAISE NOTICE 'Added selfie_url column';
    END IF;
    
    -- Add rejection_reason if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_verifications' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE kyc_verifications ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column';
    END IF;
    
    RAISE NOTICE 'KYC table schema updated successfully!';
END $$;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'kyc_verifications' 
    AND column_name IN (
        'consent_data', 'consent_terms', 'consent_accuracy', 
        'date_of_birth', 'district', 'national_id',
        'kin_name', 'kin_relationship', 'kin_phone', 'kin_address',
        'id_document_url', 'address_document_url', 'selfie_url',
        'rejection_reason'
    )
ORDER BY column_name;

-- Refresh schema cache (this might help with Supabase)
NOTIFY pgrst, 'reload schema';

RAISE NOTICE 'KYC consent fields fix completed!';
