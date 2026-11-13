-- Curated public trail content only. Personal hikes and marks stay on the phone.
create table public.trails (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  distance_m integer check (distance_m is null or distance_m >= 0),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  route_geojson jsonb,
  landmarks jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trails enable row level security;

revoke all on public.trails from anon, authenticated;
grant select on public.trails to anon, authenticated;

create policy "Read published trails"
  on public.trails for select
  to anon, authenticated
  using (published = true);
