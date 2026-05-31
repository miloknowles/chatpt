alter table public.user_issues
  add column if not exists sort_key text;

alter table public.user_qualities
  add column if not exists sort_key text;

create or replace function public.profile_fractional_index_key(item_position integer)
returns text
language plpgsql
immutable
strict
as $$
declare
  digits constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  remaining numeric := item_position;
  digit_count integer := 1;
  capacity numeric := 62;
  value numeric;
  encoded text := '';
  digit_index integer;
  counter integer;
begin
  if item_position < 0 then
    raise exception 'position must be non-negative';
  end if;

  while digit_count <= 26 loop
    if remaining < capacity then
      value := remaining;

      for counter in 1..digit_count loop
        digit_index := mod(value, 62);
        encoded := substr(digits, digit_index + 1, 1) || encoded;
        value := floor(value / 62);
      end loop;

      return chr(ascii('a') + digit_count - 1) || encoded;
    end if;

    remaining := remaining - capacity;
    digit_count := digit_count + 1;
    capacity := capacity * 62;
  end loop;

  raise exception 'position is too large';
end;
$$;

with ordered_issues as (
  select
    id,
    public.profile_fractional_index_key(
      (row_number() over (
        partition by user_id
        order by status asc, updated_at desc, created_at asc, id asc
      ) - 1)::integer
    ) as next_sort_key
  from public.user_issues
  where sort_key is null
)
update public.user_issues as target
set sort_key = ordered_issues.next_sort_key
from ordered_issues
where target.id = ordered_issues.id;

with ordered_qualities as (
  select
    id,
    public.profile_fractional_index_key(
      (row_number() over (
        partition by user_id
        order by status asc, updated_at desc, created_at asc, id asc
      ) - 1)::integer
    ) as next_sort_key
  from public.user_qualities
  where sort_key is null
)
update public.user_qualities as target
set sort_key = ordered_qualities.next_sort_key
from ordered_qualities
where target.id = ordered_qualities.id;

drop function public.profile_fractional_index_key(integer);

create index if not exists user_issues_user_id_sort_key_created_at_idx
  on public.user_issues(user_id, sort_key, created_at);

create index if not exists user_qualities_user_id_sort_key_created_at_idx
  on public.user_qualities(user_id, sort_key, created_at);
