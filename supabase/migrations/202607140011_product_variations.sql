-- Atomic owner-only configuration of product options and variants.
create or replace function public.save_owned_product_variations(
  p_product_id uuid,
  p_options jsonb,
  p_variants jsonb,
  p_track_stock boolean
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_product public.products;
  option_record jsonb;
  variant_record jsonb;
  created_option_id uuid;
  selected_value_id uuid;
  selected_value_ids uuid[];
  option_count integer;
  value_count integer;
  option_index integer;
  variant_price bigint;
  variant_sale_price bigint;
  variant_stock integer;
begin
  select p.* into target_product
  from public.products p
  join public.stores s on s.id = p.store_id
  where p.id = p_product_id and s.owner_id = auth.uid()
  for update;

  if not found then raise exception using errcode = 'P0001', message = 'product_not_owned'; end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 1 and 3 then
    raise exception using errcode = 'P0001', message = 'invalid_options';
  end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) not between 1 and 100 then
    raise exception using errcode = 'P0001', message = 'invalid_variants';
  end if;

  delete from public.product_variants where product_id = p_product_id;
  delete from public.product_options where product_id = p_product_id;

  option_index := 0;
  for option_record in select value from jsonb_array_elements(p_options) loop
    if char_length(trim(coalesce(option_record ->> 'name', ''))) not between 1 and 50
      or jsonb_typeof(option_record -> 'values') <> 'array'
      or jsonb_array_length(option_record -> 'values') not between 1 and 30 then
      raise exception using errcode = 'P0001', message = 'invalid_options';
    end if;
    insert into public.product_options (product_id, name, position)
    values (p_product_id, trim(option_record ->> 'name'), option_index)
    returning id into created_option_id;
    value_count := 0;
    insert into public.product_option_values (option_id, value, position)
    select created_option_id, trim(raw.value), raw.ordinality::integer - 1
    from jsonb_array_elements_text(option_record -> 'values') with ordinality as raw(value, ordinality)
    where char_length(trim(raw.value)) between 1 and 80;
    get diagnostics value_count = row_count;
    if value_count <> jsonb_array_length(option_record -> 'values') then
      raise exception using errcode = 'P0001', message = 'invalid_options';
    end if;
    option_index := option_index + 1;
  end loop;

  option_count := jsonb_array_length(p_options);
  for variant_record in select value from jsonb_array_elements(p_variants) loop
    if jsonb_typeof(variant_record -> 'values') <> 'array'
      or jsonb_array_length(variant_record -> 'values') <> option_count then
      raise exception using errcode = 'P0001', message = 'invalid_variants';
    end if;
    selected_value_ids := '{}';
    for option_index in 0..option_count - 1 loop
      select value.id into selected_value_id
      from public.product_options option
      join public.product_option_values value on value.option_id = option.id
      where option.product_id = p_product_id
        and option.position = option_index
        and value.value = variant_record -> 'values' ->> option_index;
      if selected_value_id is null then raise exception using errcode = 'P0001', message = 'invalid_variants'; end if;
      selected_value_ids := array_append(selected_value_ids, selected_value_id);
    end loop;

    variant_price := nullif(variant_record ->> 'price_cents', '')::bigint;
    variant_sale_price := nullif(variant_record ->> 'sale_price_cents', '')::bigint;
    variant_stock := nullif(variant_record ->> 'stock_quantity', '')::integer;
    if variant_price is not null and variant_price < 0 then raise exception using errcode = 'P0001', message = 'invalid_variant_price'; end if;
    if variant_sale_price is not null and (variant_sale_price < 0 or variant_sale_price >= coalesce(variant_price, target_product.price_cents)) then
      raise exception using errcode = 'P0001', message = 'invalid_variant_price';
    end if;
    if p_track_stock and (variant_stock is null or variant_stock < 0) then raise exception using errcode = 'P0001', message = 'invalid_variant_stock'; end if;

    insert into public.product_variants (product_id, sku, option_value_ids, price_cents, sale_price_cents, stock_quantity, is_active)
    values (p_product_id, nullif(trim(coalesce(variant_record ->> 'sku', '')), ''), selected_value_ids,
      variant_price, variant_sale_price, case when p_track_stock then variant_stock else null end,
      coalesce((variant_record ->> 'is_active')::boolean, true));
  end loop;

  update public.products
  set stock_mode = 'variant', track_stock = p_track_stock, stock_quantity = null
  where id = p_product_id;
end;
$$;

revoke execute on function public.save_owned_product_variations(uuid, jsonb, jsonb, boolean) from public;
grant execute on function public.save_owned_product_variations(uuid, jsonb, jsonb, boolean) to authenticated;

create or replace function public.disable_owned_product_variations(
  p_product_id uuid,
  p_track_stock boolean,
  p_stock_quantity integer
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = p_product_id and s.owner_id = auth.uid()
  ) then raise exception using errcode = 'P0001', message = 'product_not_owned'; end if;
  if p_track_stock and (p_stock_quantity is null or p_stock_quantity < 0) then
    raise exception using errcode = 'P0001', message = 'invalid_product_stock';
  end if;
  delete from public.product_variants where product_id = p_product_id;
  delete from public.product_options where product_id = p_product_id;
  update public.products set stock_mode = 'product', track_stock = p_track_stock,
    stock_quantity = case when p_track_stock then p_stock_quantity else null end
  where id = p_product_id;
end;
$$;

revoke execute on function public.disable_owned_product_variations(uuid, boolean, integer) from public;
grant execute on function public.disable_owned_product_variations(uuid, boolean, integer) to authenticated;

-- Keep anonymous recovery carts variant-aware without trusting frontend prices.
create or replace function public.sync_anonymous_cart(p_store_id uuid, p_anonymous_token uuid, p_items jsonb)
returns table(cart_id uuid, subtotal_cents bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_cart_id uuid;
  item jsonb;
  current_product public.products;
  current_variant public.product_variants;
  requested_quantity integer;
  computed_subtotal bigint := 0;
  unit_price bigint;
  requested_variant_id uuid;
  selected_options jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'Invalid cart'; end if;
  if not exists (select 1 from public.stores s where s.id = p_store_id and s.is_active) then raise exception 'Store unavailable'; end if;
  insert into public.carts (store_id, anonymous_token, status, expires_at)
  values (p_store_id, p_anonymous_token, 'active', now() + interval '30 days')
  on conflict (store_id, anonymous_token) do update set status = case when public.carts.status in ('converted','cancelled') then 'active' else public.carts.status end, expires_at = now() + interval '30 days'
  returning id into current_cart_id;
  delete from public.cart_items where cart_id = current_cart_id;

  for item in select value from jsonb_array_elements(p_items) loop
    requested_quantity := greatest(1, least(99, coalesce((item ->> 'quantity')::integer, 1)));
    requested_variant_id := nullif(item ->> 'variant_id', '')::uuid;
    select * into current_product from public.products
    where id = (item ->> 'product_id')::uuid and store_id = p_store_id and is_active;
    if not found then continue; end if;
    current_variant := null;
    selected_options := '{}'::jsonb;
    if current_product.stock_mode = 'variant' then
      if requested_variant_id is null then continue; end if;
      select * into current_variant from public.product_variants
      where id = requested_variant_id and product_id = current_product.id and is_active;
      if not found then continue; end if;
      unit_price := coalesce(current_variant.sale_price_cents, current_variant.price_cents, current_product.sale_price_cents, current_product.price_cents);
      if current_product.track_stock then requested_quantity := least(requested_quantity, coalesce(current_variant.stock_quantity, 0)); end if;
      select coalesce(jsonb_object_agg(option.name, value.value), '{}'::jsonb) into selected_options
      from public.product_option_values value join public.product_options option on option.id = value.option_id
      where value.id = any(current_variant.option_value_ids);
    else
      unit_price := coalesce(current_product.sale_price_cents, current_product.price_cents);
      if current_product.track_stock then requested_quantity := least(requested_quantity, coalesce(current_product.stock_quantity, 0)); end if;
    end if;
    if requested_quantity > 0 then
      insert into public.cart_items (cart_id, product_id, variant_id, product_name, unit_price_cents, quantity, selected_options)
      values (current_cart_id, current_product.id, requested_variant_id, current_product.name, unit_price, requested_quantity, selected_options);
      computed_subtotal := computed_subtotal + unit_price * requested_quantity;
    end if;
  end loop;
  update public.carts set subtotal_cents = computed_subtotal,
    status = case when computed_subtotal = 0 then 'cancelled'::public.cart_status else 'active'::public.cart_status end
  where id = current_cart_id;
  return query select current_cart_id, computed_subtotal;
end;
$$;

revoke execute on function public.sync_anonymous_cart(uuid, uuid, jsonb) from public;
grant execute on function public.sync_anonymous_cart(uuid, uuid, jsonb) to anon, authenticated;
