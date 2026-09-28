alter table public.cnhi_spot enable row level security;

drop policy if exists "Public can read cnhi spot" on public.cnhi_spot;
create policy "Public can read cnhi spot"
  on public.cnhi_spot for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow insert price lists" on public.price_lists;

revoke insert, update, delete on table public.cnhi_spot from anon, authenticated;
revoke insert, update, delete on table public.inventory from anon, authenticated;
revoke insert, update, delete on table public.price_lists from anon, authenticated;
revoke insert, update, delete on table public.equipment_photos from anon, authenticated;
revoke insert, update, delete on table public.equipment_proposals from anon, authenticated;
revoke insert, update, delete on table public.equipment_brochures from anon, authenticated;
revoke insert, update, delete on table public.reservation_requests from anon, authenticated;
revoke insert, update, delete on table public.stock_sync_runs from anon, authenticated;
