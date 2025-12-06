-- Drop existing check constraint
alter table public.transactions drop constraint transactions_status_check;

-- Add new check constraint with product_delivered
alter table public.transactions add constraint transactions_status_check 
check (status in (
  'created', 
  'product_submitted', 
  'product_approved', 
  'payment_uploaded', 
  'payment_verified', 
  'product_delivered', -- New status
  'inspection_passed', 
  'funds_released', 
  'cancelled', 
  'rejected',
  'payment_rejected',
  'inspection_failed'
));
