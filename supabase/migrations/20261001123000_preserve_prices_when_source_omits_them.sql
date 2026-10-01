create or replace function public.apply_stock_sync(
  p_inventory jsonb,
  p_spot jsonb,
  p_source_file text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  synced_at timestamptz := now();
  inventory_count integer;
  spot_count integer;
begin
  if jsonb_typeof(p_inventory) <> 'array' or jsonb_array_length(p_inventory) = 0 then
    raise exception 'inventory payload is empty';
  end if;
  if jsonb_typeof(p_spot) <> 'array' or jsonb_array_length(p_spot) = 0 then
    raise exception 'spot payload is empty';
  end if;

  update public.inventory
  set is_active = false
  where is_active is distinct from false;

  insert into public.inventory (
    brand, model, configuration, external_id, serial_number, production_year, arrival_date,
    location, status, status_priority, contract_currency, price_with_vat,
    specification, warranty, is_active, source_file, source_synced_at
  )
  select
    x.brand, x.model, x.configuration, x.external_id, x.serial_number, x.production_year,
    x.arrival_date, x.location, x.status, x.status_priority,
    x.contract_currency, x.price_with_vat, x.specification, x.warranty,
    true, p_source_file, synced_at
  from jsonb_to_recordset(p_inventory) as x(
    brand text, model text, configuration text, external_id text, serial_number text,
    production_year integer, arrival_date date, location text, status text,
    status_priority integer, contract_currency text, price_with_vat numeric,
    specification text, warranty text
  )
  on conflict (serial_number) where serial_number is not null do update set
    brand = excluded.brand,
    model = excluded.model,
    configuration = excluded.configuration,
    external_id = excluded.external_id,
    production_year = excluded.production_year,
    arrival_date = excluded.arrival_date,
    location = excluded.location,
    status = excluded.status,
    status_priority = excluded.status_priority,
    contract_currency = coalesce(excluded.contract_currency, inventory.contract_currency),
    price_with_vat = coalesce(excluded.price_with_vat, inventory.price_with_vat),
    specification = excluded.specification,
    warranty = excluded.warranty,
    is_active = true,
    source_file = excluded.source_file,
    source_synced_at = excluded.source_synced_at;

  update public.cnhi_spot
  set is_active = false
  where is_active is distinct from false;

  insert into public.cnhi_spot (
    external_id, brand, type, model, production_year, status,
    contract_currency, price_with_vat, delivery_terms, delivery,
    specification, is_active, source_file, source_synced_at
  )
  select
    x.external_id, x.brand, x.type, x.model, x.production_year, x.status,
    x.contract_currency, x.price_with_vat, x.delivery_terms, x.delivery,
    x.specification, true, p_source_file, synced_at
  from jsonb_to_recordset(p_spot) as x(
    external_id text, brand text, type text, model text,
    production_year integer, status text, contract_currency text,
    price_with_vat numeric, delivery_terms text, delivery text,
    specification text
  )
  on conflict (external_id) where external_id is not null do update set
    brand = excluded.brand,
    type = excluded.type,
    model = excluded.model,
    production_year = excluded.production_year,
    status = excluded.status,
    contract_currency = coalesce(excluded.contract_currency, cnhi_spot.contract_currency),
    price_with_vat = coalesce(excluded.price_with_vat, cnhi_spot.price_with_vat),
    delivery_terms = excluded.delivery_terms,
    delivery = excluded.delivery,
    specification = excluded.specification,
    is_active = true,
    source_file = excluded.source_file,
    source_synced_at = excluded.source_synced_at;

  select count(*) into inventory_count from public.inventory where is_active;
  select count(*) into spot_count from public.cnhi_spot where is_active;

  insert into public.stock_sync_runs (source_file, inventory_count, spot_count)
  values (p_source_file, inventory_count, spot_count);

  return jsonb_build_object(
    'inventory_count', inventory_count,
    'spot_count', spot_count,
    'synced_at', synced_at
  );
end;
$$;

revoke all on function public.apply_stock_sync(jsonb, jsonb, text) from public;
grant execute on function public.apply_stock_sync(jsonb, jsonb, text) to service_role;
