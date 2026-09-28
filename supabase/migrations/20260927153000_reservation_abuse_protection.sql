alter table public.reservation_requests
  add column if not exists request_key uuid,
  add column if not exists requester_fingerprint text;

create unique index if not exists reservation_requests_request_key_key
  on public.reservation_requests (request_key)
  where request_key is not null;

create index if not exists reservation_requests_fingerprint_created_idx
  on public.reservation_requests (requester_fingerprint, created_at desc)
  where requester_fingerprint is not null;
