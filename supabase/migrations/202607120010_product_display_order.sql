-- Manual product ordering per store. Existing storefront order is preserved.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='products' and column_name='display_position'
  ) then
    alter table public.products add column display_position integer not null default 0;
    with ranked as (
      select id,(row_number() over (partition by store_id order by created_at desc,id)-1)::integer as position
      from public.products
    )
    update public.products as product set display_position=ranked.position from ranked where product.id=ranked.id;
  end if;
end $$;

create index if not exists products_store_display_position_idx
  on public.products (store_id, display_position, created_at desc);

create or replace function public.move_owned_product(p_product_id uuid, p_direction text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_product public.products; adjacent_product public.products;
begin
  if p_direction not in ('up','down') then raise exception using errcode='P0001',message='invalid_direction'; end if;
  select * into target_product from public.products where id=p_product_id for update;
  if not found or not exists(select 1 from public.stores where id=target_product.store_id and owner_id=auth.uid()) then
    raise exception using errcode='42501',message='not_allowed';
  end if;
  if p_direction='up' then
    select * into adjacent_product from public.products where store_id=target_product.store_id and display_position<target_product.display_position order by display_position desc,created_at asc limit 1 for update;
  else
    select * into adjacent_product from public.products where store_id=target_product.store_id and display_position>target_product.display_position order by display_position asc,created_at desc limit 1 for update;
  end if;
  if not found then return; end if;
  update public.products set display_position=case when id=target_product.id then adjacent_product.display_position when id=adjacent_product.id then target_product.display_position end where id in(target_product.id,adjacent_product.id);
end; $$;

revoke execute on function public.move_owned_product(uuid,text) from public;
grant execute on function public.move_owned_product(uuid,text) to authenticated;
