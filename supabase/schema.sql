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
drop policy if exists "Authenticated users can manage direct costs"
  on public.direct_cost_items;
create policy "Authenticated users can manage direct costs"
  on public.direct_cost_items
  for all
  to authenticated
  using (true)
  with check (true);

revoke all on table public.direct_cost_items from anon, authenticated;
grant select, insert, update, delete on table public.direct_cost_items to authenticated;

create or replace function public.add_direct_cost_item(
  p_code text,
  p_description text,
  p_unit text,
  p_cost numeric,
  p_category text
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  next_source_row integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if nullif(btrim(p_code), '') is null
    or nullif(btrim(p_description), '') is null
    or nullif(btrim(p_category), '') is null then
    raise exception 'Code, description, and category are required';
  end if;
  if p_cost is not null and p_cost < 0 then
    raise exception 'Cost cannot be negative';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.direct_cost_items'));
  select coalesce(max(source_row), 0) + 1
    into next_source_row
    from public.direct_cost_items;

  insert into public.direct_cost_items (source_row, code, description, unit, cost, category)
  values (next_source_row, btrim(p_code), btrim(p_description), coalesce(btrim(p_unit), ''), p_cost, btrim(p_category));

  return next_source_row;
end;
$$;

create or replace function public.replace_direct_cost_items(p_items jsonb)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  imported_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Import data must be a JSON array';
  end if;
  imported_count := jsonb_array_length(p_items);
  if imported_count > 10000 then
    raise exception 'Import is limited to 10000 rows';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as records(item)
    where jsonb_typeof(records.item) <> 'object'
      or nullif(btrim(records.item ->> 'code'), '') is null
      or nullif(btrim(records.item ->> 'description'), '') is null
      or nullif(btrim(records.item ->> 'category'), '') is null
      or (
        nullif(btrim(records.item ->> 'cost'), '') is not null
        and (records.item ->> 'cost')::numeric < 0
      )
  ) then
    raise exception 'Every row needs a code, description, and category; costs cannot be negative';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.direct_cost_items'));
  delete from public.direct_cost_items
  where source_row is not null;
  insert into public.direct_cost_items (source_row, code, description, unit, cost, category)
  select
    records.ordinality::integer,
    btrim(records.item ->> 'code'),
    btrim(records.item ->> 'description'),
    coalesce(btrim(records.item ->> 'unit'), ''),
    nullif(btrim(records.item ->> 'cost'), '')::numeric,
    btrim(records.item ->> 'category')
  from jsonb_array_elements(p_items) with ordinality as records(item, ordinality)
  order by records.ordinality;

  return imported_count;
end;
$$;

revoke all on function public.add_direct_cost_item(text, text, text, numeric, text) from public, anon;
revoke all on function public.replace_direct_cost_items(jsonb) from public, anon;
grant execute on function public.add_direct_cost_item(text, text, text, numeric, text) to authenticated;
grant execute on function public.replace_direct_cost_items(jsonb) to authenticated;

create table if not exists public.resource_items (
  resource_type text not null check (resource_type in ('equipment', 'labour', 'material')),
  source_row integer not null check (source_row > 0),
  name text not null check (btrim(name) <> ''),
  unit text not null check (btrim(unit) <> ''),
  price numeric(14, 2) not null check (price >= 0),
  category text not null check (btrim(category) <> ''),
  primary key (resource_type, source_row)
);

alter table public.resource_items enable row level security;

drop policy if exists "Authenticated users can manage resource items"
  on public.resource_items;
create policy "Authenticated users can manage resource items"
  on public.resource_items
  for all
  to authenticated
  using (true)
  with check (true);

revoke all on table public.resource_items from anon, authenticated;
grant select, insert, update, delete on table public.resource_items to authenticated;

create or replace function public.add_resource_item(
  p_resource_type text,
  p_name text,
  p_unit text,
  p_price numeric,
  p_category text
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  next_source_row integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_resource_type is null
    or p_resource_type not in ('equipment', 'labour', 'material') then
    raise exception 'Invalid resource list';
  end if;
  if nullif(btrim(p_name), '') is null
    or nullif(btrim(p_unit), '') is null
    or nullif(btrim(p_category), '') is null
    or p_price is null then
    raise exception 'Name, unit, price, and category are required';
  end if;
  if p_price < 0 then
    raise exception 'Price cannot be negative';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.resource_items:' || p_resource_type));
  select coalesce(max(source_row), 0) + 1
    into next_source_row
    from public.resource_items
    where resource_type = p_resource_type;

  insert into public.resource_items (resource_type, source_row, name, unit, price, category)
  values (p_resource_type, next_source_row, btrim(p_name), btrim(p_unit), p_price, btrim(p_category));

  return next_source_row;
end;
$$;

create or replace function public.replace_resource_items(
  p_resource_type text,
  p_items jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  imported_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_resource_type is null
    or p_resource_type not in ('equipment', 'labour', 'material') then
    raise exception 'Invalid resource list';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Import data must be a JSON array';
  end if;
  imported_count := jsonb_array_length(p_items);
  if imported_count = 0 then
    raise exception 'Import must contain at least one item';
  end if;
  if imported_count > 10000 then
    raise exception 'Import is limited to 10000 rows';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as records(item)
    where jsonb_typeof(records.item) <> 'object'
      or nullif(btrim(records.item ->> 'name'), '') is null
      or nullif(btrim(records.item ->> 'unit'), '') is null
      or nullif(btrim(records.item ->> 'category'), '') is null
      or case
        when coalesce(btrim(records.item ->> 'price'), '') ~ '^[0-9]+([.][0-9]+)?$'
          then (records.item ->> 'price')::numeric < 0
        else true
      end
  ) then
    raise exception 'Every row needs a name, unit, valid non-negative price, and category';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.resource_items:' || p_resource_type));
  delete from public.resource_items
    where resource_type = p_resource_type;
  insert into public.resource_items (resource_type, source_row, name, unit, price, category)
  select
    p_resource_type,
    records.ordinality::integer,
    btrim(records.item ->> 'name'),
    btrim(records.item ->> 'unit'),
    (records.item ->> 'price')::numeric,
    btrim(records.item ->> 'category')
  from jsonb_array_elements(p_items) with ordinality as records(item, ordinality)
  order by records.ordinality;

  return imported_count;
end;
$$;

revoke all on function public.add_resource_item(text, text, text, numeric, text) from public, anon;
revoke all on function public.replace_resource_items(text, jsonb) from public, anon;
grant execute on function public.add_resource_item(text, text, text, numeric, text) to authenticated;
grant execute on function public.replace_resource_items(text, jsonb) to authenticated;

notify pgrst, 'reload schema';
