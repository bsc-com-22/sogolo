-- Drop the restrictive policy
drop policy "Users can view transactions they are involved in" on public.transactions;

-- Create a more permissive policy
create policy "Users can view transactions they are involved in or open ones"
  on public.transactions for select
  using (
    auth.uid() = buyer_id 
    or auth.uid() = seller_id 
    or seller_id is null
  );
