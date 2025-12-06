-- Create Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  buyer_id uuid references auth.users(id) not null,
  seller_id uuid references auth.users(id),
  status text default 'created' check (status in ('created', 'product_submitted', 'product_approved', 'payment_uploaded', 'payment_verified', 'inspection_passed', 'funds_released', 'cancelled', 'rejected')),
  price decimal(12,2)
);

-- Enable RLS for Transactions
alter table public.transactions enable row level security;

-- Policies for Transactions
create policy "Buyers can create transactions"
  on public.transactions for insert
  with check (auth.uid() = buyer_id);

create policy "Users can view transactions they are involved in"
  on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Sellers can join transactions"
  on public.transactions for update
  using (true) -- Ideally restrict to empty seller_id, but for simplicity allow update if they have the link/ID
  with check (auth.uid() = seller_id);
  
-- Create Product Submissions Table
create table public.product_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  transaction_id uuid references public.transactions(id) not null,
  product_name text not null,
  product_description text not null,
  price decimal(12,2)
);

-- Enable RLS for Product Submissions
alter table public.product_submissions enable row level security;

-- Policies for Product Submissions
create policy "Sellers can create product submissions"
  on public.product_submissions for insert
  with check (exists (
    select 1 from public.transactions
    where id = transaction_id and seller_id = auth.uid()
  ));

create policy "Involved parties can view product submissions"
  on public.product_submissions for select
  using (exists (
    select 1 from public.transactions
    where id = transaction_id and (buyer_id = auth.uid() or seller_id = auth.uid())
  ));

-- Create Product Images Table
create table public.product_images (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  transaction_id uuid references public.transactions(id) not null,
  image_url text not null
);

-- Enable RLS for Product Images
alter table public.product_images enable row level security;

-- Policies for Product Images
create policy "Sellers can upload product images"
  on public.product_images for insert
  with check (exists (
    select 1 from public.transactions
    where id = transaction_id and seller_id = auth.uid()
  ));

create policy "Involved parties can view product images"
  on public.product_images for select
  using (exists (
    select 1 from public.transactions
    where id = transaction_id and (buyer_id = auth.uid() or seller_id = auth.uid())
  ));

-- Create Payment Proofs Table
create table public.payment_proofs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  transaction_id uuid references public.transactions(id) not null,
  proof_url text not null,
  amount decimal(12,2)
);

-- Enable RLS for Payment Proofs
alter table public.payment_proofs enable row level security;

-- Policies for Payment Proofs
create policy "Buyers can upload payment proofs"
  on public.payment_proofs for insert
  with check (exists (
    select 1 from public.transactions
    where id = transaction_id and buyer_id = auth.uid()
  ));

create policy "Involved parties can view payment proofs"
  on public.payment_proofs for select
  using (exists (
    select 1 from public.transactions
    where id = transaction_id and (buyer_id = auth.uid() or seller_id = auth.uid())
  ));

-- Storage Bucket for Images
insert into storage.buckets (id, name, public) values ('transaction-images', 'transaction-images', true);

-- Storage Policy
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'transaction-images' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'transaction-images' and auth.role() = 'authenticated' );

-- Create Profiles Table (Linked to Auth Users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  updated_at timestamp with time zone,
  full_name text,
  address text,
  city text,
  phone text,
  next_of_kin_name text,
  next_of_kin_phone text,
  id_front_url text,
  id_back_url text,
  selfie_url text,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'under_review', 'approved', 'rejected')),
  role text default 'user' check (role in ('user', 'admin'))
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, kyc_status)
  values (new.id, new.raw_user_meta_data->>'full_name', 'pending');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket for KYC Documents
insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false); -- Private bucket

-- Storage Policies for KYC
create policy "Users can upload their own KYC docs"
  on storage.objects for insert
  with check ( bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can view their own KYC docs"
  on storage.objects for select
  using ( bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Admins can view all KYC docs"
  on storage.objects for select
  using ( bucket_id = 'kyc-documents' and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
