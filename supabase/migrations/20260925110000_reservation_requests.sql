create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  buyer_inn text not null check (buyer_inn ~ '^(\d{10}|\d{12})$'),
  retail_price numeric(18, 2) not null check (retail_price > 0),
  currency text not null,
  model text not null,
  configuration text,
  external_id text,
  serial_number text,
  status text not null default 'new' check (status in ('new', 'approved', 'declined', 'cancelled')),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  email_provider_id text,
  email_error text,
  requester_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_requests_inventory_created_idx
  on public.reservation_requests (inventory_id, created_at desc);

create index if not exists reservation_requests_status_created_idx
  on public.reservation_requests (status, created_at desc);

alter table public.reservation_requests enable row level security;

-- Requests are created only by the server with the service-role key.
-- Public read/write policies are intentionally not added.
