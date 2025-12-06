-- Drop the restrictive policy
drop policy "Sellers can join transactions" on public.transactions;

-- Create a comprehensive update policy
create policy "Involved parties and Admins can update transactions"
  on public.transactions for update
  using (
    -- Buyer can update
    auth.uid() = buyer_id 
    -- Seller can update
    or auth.uid() = seller_id
    -- New Seller can join (if no seller yet)
    or seller_id is null
    -- Admin can update
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    -- Ensure user is involved or admin
    auth.uid() = buyer_id 
    or auth.uid() = seller_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
