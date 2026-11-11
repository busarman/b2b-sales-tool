-- The public portal reads the catalog through /api/catalog/*, which returns RRC.
-- Source dealer prices and retired commercial proposals remain server-only.
revoke select on public.inventory, public.cnhi_spot, public.price_lists,
  public.equipment_proposals, public.reservation_requests,
  public.stock_sync_runs from anon, authenticated;

update storage.buckets set public = false where id in ('equipment-proposals', 'prices');
