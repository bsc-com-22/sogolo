-- Update Transactions Select Policy
drop policy "Users can view transactions they are involved in or open ones" on public.transactions;

create policy "Users and Admins can view transactions"
  on public.transactions for select
  using (
    auth.uid() = buyer_id 
    or auth.uid() = seller_id 
    or seller_id is null
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Update Payment Proofs Select Policy
drop policy "Involved parties can view payment proofs" on public.payment_proofs;

create policy "Involved parties and Admins can view payment proofs"
  on public.payment_proofs for select
  using (
    exists (
      select 1 from public.transactions
      where id = transaction_id 
      and (
        buyer_id = auth.uid() 
        or seller_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );
