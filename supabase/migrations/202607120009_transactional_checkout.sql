-- Idempotent, transactional public checkout. Prices and stock are always resolved server-side.
alter table public.orders
  add column if not exists checkout_token uuid not null default gen_random_uuid();

create unique index if not exists orders_checkout_token_key
  on public.orders (checkout_token);

create or replace function public.create_public_order(
  p_store_id uuid,
  p_checkout_token uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_store public.stores;
  existing_order public.orders;
  created_order public.orders;
  item jsonb;
  product_record public.products;
  variant_record public.product_variants;
  item_id uuid;
  product_id_value uuid;
  variant_id_value uuid;
  quantity_value integer;
  unit_price bigint;
  subtotal bigint := 0;
  normalized_items jsonb := '[]'::jsonb;
  seen_keys text[] := '{}';
  option_record record;
begin
  if p_checkout_token is null then raise exception using errcode='P0001', message='invalid_checkout'; end if;
  select * into existing_order from public.orders where checkout_token = p_checkout_token;
  if found then
    if existing_order.store_id <> p_store_id then raise exception using errcode='P0001', message='invalid_checkout'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('product_name',i.product_name,'quantity',i.quantity,'unit_price_cents',i.unit_price_cents,'line_total_cents',i.line_total_cents) order by i.created_at),'[]'::jsonb)
      into normalized_items from public.order_items i where i.order_id=existing_order.id;
    return jsonb_build_object('order_id',existing_order.id,'order_number',existing_order.order_number,'subtotal_cents',existing_order.subtotal_cents,'items',normalized_items);
  end if;

  select * into target_store from public.stores where id=p_store_id and is_active and publication_status='published';
  if not found then raise exception using errcode='P0001', message='store_unavailable'; end if;
  if char_length(trim(coalesce(p_customer_name,''))) not between 2 and 120 then raise exception using errcode='P0001', message='invalid_customer'; end if;
  if char_length(trim(coalesce(p_customer_phone,''))) not between 8 and 30 then raise exception using errcode='P0001', message='invalid_phone'; end if;
  if char_length(coalesce(p_customer_notes,'')) > 1000 then raise exception using errcode='P0001', message='invalid_notes'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then raise exception using errcode='P0001', message='invalid_items'; end if;

  -- Lock every requested product and calculate the authoritative subtotal.
  for item in select value from jsonb_array_elements(p_items) loop
    begin product_id_value := (item->>'product_id')::uuid; exception when others then raise exception using errcode='P0001', message='invalid_items'; end;
    begin quantity_value := (item->>'quantity')::integer; exception when others then raise exception using errcode='P0001', message='invalid_items'; end;
    if quantity_value<1 or quantity_value>999 then raise exception using errcode='P0001', message='invalid_quantity'; end if;
    variant_id_value := null;
    if nullif(item->>'variant_id','') is not null then begin variant_id_value := (item->>'variant_id')::uuid; exception when others then raise exception using errcode='P0001', message='invalid_items'; end; end if;
    if (product_id_value::text||':'||coalesce(variant_id_value::text,''))=any(seen_keys) then raise exception using errcode='P0001', message='duplicate_item'; end if;
    seen_keys:=array_append(seen_keys,product_id_value::text||':'||coalesce(variant_id_value::text,''));

    select * into product_record from public.products where id=product_id_value and store_id=p_store_id and is_active for update;
    if not found then raise exception using errcode='P0001', message='product_unavailable'; end if;
    variant_record:=null;
    if variant_id_value is not null then
      select * into variant_record from public.product_variants where id=variant_id_value and product_id=product_id_value and is_active for update;
      if not found then raise exception using errcode='P0001', message='variant_unavailable'; end if;
      unit_price:=coalesce(variant_record.sale_price_cents,variant_record.price_cents,product_record.sale_price_cents,product_record.price_cents);
      if product_record.track_stock and product_record.stock_mode='variant' then
        if coalesce(variant_record.stock_quantity,0)<quantity_value then raise exception using errcode='P0001', message='stock_unavailable'; end if;
      end if;
    else
      if product_record.stock_mode='variant' then raise exception using errcode='P0001', message='variant_required'; end if;
      unit_price:=coalesce(product_record.sale_price_cents,product_record.price_cents);
    end if;
    if product_record.track_stock and product_record.stock_mode='product' and coalesce(product_record.stock_quantity,0)<quantity_value then raise exception using errcode='P0001', message='stock_unavailable'; end if;
    subtotal:=subtotal+(unit_price*quantity_value);
  end loop;

  insert into public.orders(store_id,checkout_token,customer_name,customer_phone,customer_notes,subtotal_cents,total_cents)
  values(p_store_id,p_checkout_token,trim(p_customer_name),trim(p_customer_phone),nullif(trim(coalesce(p_customer_notes,'')),''),subtotal,subtotal)
  returning * into created_order;

  for item in select value from jsonb_array_elements(p_items) loop
    product_id_value:=(item->>'product_id')::uuid; quantity_value:=(item->>'quantity')::integer; variant_id_value:=nullif(item->>'variant_id','')::uuid;
    select * into product_record from public.products where id=product_id_value;
    variant_record:=null;
    if variant_id_value is not null then select * into variant_record from public.product_variants where id=variant_id_value; end if;
    unit_price:=coalesce(variant_record.sale_price_cents,variant_record.price_cents,product_record.sale_price_cents,product_record.price_cents);
    insert into public.order_items(order_id,product_id,variant_id,product_name,sku,unit_price_cents,quantity,line_total_cents)
    values(created_order.id,product_record.id,variant_id_value,product_record.name,variant_record.sku,unit_price,quantity_value,unit_price*quantity_value)
    returning id into item_id;
    if variant_id_value is not null then
      for option_record in select o.name,v.value from public.product_option_values v join public.product_options o on o.id=v.option_id where v.id=any(variant_record.option_value_ids) order by o.position,v.position loop
        insert into public.order_item_options(order_item_id,option_name,option_value) values(item_id,option_record.name,option_record.value);
      end loop;
      if product_record.track_stock and product_record.stock_mode='variant' then update public.product_variants set stock_quantity=stock_quantity-quantity_value where id=variant_id_value; end if;
    end if;
    if product_record.track_stock and product_record.stock_mode='product' then update public.products set stock_quantity=stock_quantity-quantity_value where id=product_id_value; end if;
    normalized_items:=normalized_items||jsonb_build_array(jsonb_build_object('product_name',product_record.name,'quantity',quantity_value,'unit_price_cents',unit_price,'line_total_cents',unit_price*quantity_value));
  end loop;
  return jsonb_build_object('order_id',created_order.id,'order_number',created_order.order_number,'subtotal_cents',subtotal,'items',normalized_items);
exception when unique_violation then
  select * into existing_order from public.orders where checkout_token=p_checkout_token;
  return jsonb_build_object('order_id',existing_order.id,'order_number',existing_order.order_number,'subtotal_cents',existing_order.subtotal_cents);
end;
$$;

revoke execute on function public.create_public_order(uuid,uuid,text,text,text,jsonb) from public;
grant execute on function public.create_public_order(uuid,uuid,text,text,text,jsonb) to anon, authenticated;
