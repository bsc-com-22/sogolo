-- Fix transaction status check constraint to include all required status values

-- First, drop the existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add missing columns for delivery and dispatch tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS delivery_method text,
ADD COLUMN IF NOT EXISTS delivery_branch text,
ADD COLUMN IF NOT EXISTS dispatch_receipt_url text;

-- Create storage bucket for dispatch receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('transaction-receipts', 'transaction-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for dispatch receipts
CREATE POLICY "Public access to dispatch receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'transaction-receipts');

CREATE POLICY "Authenticated users can upload dispatch receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'transaction-receipts' AND auth.role() = 'authenticated');

-- Add the updated constraint with all status values used by the application
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN (
    'created', 
    'product_submitted', 
    'product_approved', 
    'payment_uploaded', 
    'payment_verified', 
    'payment_rejected',  -- Added
    'inspection_passed', 
    'inspection_failed',  -- Added
    'funds_released', 
    'cancelled', 
    'rejected',
    'product_delivered', -- Added
    'completed',         -- Added
    'dispatched'         -- Added
));
