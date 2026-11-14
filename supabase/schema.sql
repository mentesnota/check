create table if not exists public.direct_cost_items (
  source_row integer primary key check (source_row > 0),
  code text not null,
  description text not null,
  unit text not null default '',
  cost numeric(14, 2),
  category text not null
);

alter table public.direct_cost_items enable row level security;

drop policy if exists "Authenticated users can read direct costs"
  on public.direct_cost_items;
create policy "Authenticated users can read direct costs"
  on public.direct_cost_items
  for select
  to authenticated
  using (true);

revoke all on table public.direct_cost_items from anon, authenticated;
grant select on table public.direct_cost_items to authenticated;
