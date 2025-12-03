-- Add delivery columns
alter table public.transactions add column if not exists delivery_method text;
alter table public.transactions add column if not exists delivery_branch text;
alter table public.transactions add column if not exists dispatch_receipt_url text;

-- Drop existing check constraint
alter table public.transactions drop constraint transactions_status_check;

-- Add new check constraint with dispatched
alter table public.transactions add constraint transactions_status_check 
check (status in (
  'created', 
  'product_submitted', 
  'product_approved', 
  'payment_uploaded', 
  'payment_verified', 
  'product_delivered',
  'inspection_passed', 
  'funds_released', 
  'dispatched', -- New status
  'cancelled', 
  'rejected',
  'payment_rejected',
  'inspection_failed'
));

-- Storage Bucket for Receipts
insert into storage.buckets (id, name, public) values ('transaction-receipts', 'transaction-receipts', true)
on conflict (id) do nothing;

-- Storage Policy for Receipts
create policy "Admins can upload receipts"
  on storage.objects for insert
  with check ( bucket_id = 'transaction-receipts' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Public Access to Receipts"
  on storage.objects for select
  using ( bucket_id = 'transaction-receipts' );
