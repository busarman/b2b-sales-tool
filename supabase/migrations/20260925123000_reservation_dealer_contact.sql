alter table public.reservation_requests
  add column if not exists dealer_company text,
  add column if not exists dealer_phone text,
  add column if not exists dealer_name text;

alter table public.reservation_requests
  add constraint reservation_requests_dealer_company_check
    check (length(trim(dealer_company)) >= 2),
  add constraint reservation_requests_dealer_phone_check
    check (dealer_phone ~ '^\+?\d{10,15}$'),
  add constraint reservation_requests_dealer_name_check
    check (length(trim(dealer_name)) >= 2);

alter table public.reservation_requests
  alter column dealer_company set not null,
  alter column dealer_phone set not null,
  alter column dealer_name set not null;
