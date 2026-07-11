create extension if not exists pgcrypto;

create type public.stock_mode as enum ('product', 'variant');
create type public.order_status as enum ('new', 'confirmed', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 1000), logo_path text, banner_path text,
  whatsapp text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80), slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  position integer not null default 0 check (position >= 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (store_id, slug), unique (id, store_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid, name text not null check (char_length(name) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), description text check (char_length(description) <= 5000),
  price_cents bigint not null check (price_cents >= 0), sale_price_cents bigint check (sale_price_cents >= 0 and sale_price_cents < price_cents),
  is_active boolean not null default true, track_stock boolean not null default false, stock_mode public.stock_mode not null default 'product',
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (store_id, slug),
  constraint products_category_store_fk foreign key (category_id, store_id) references public.categories(id, store_id) on delete set null (category_id),
  constraint product_stock_consistency check ((not track_stock and stock_quantity is null) or (track_stock and ((stock_mode = 'product' and stock_quantity is not null) or (stock_mode = 'variant' and stock_quantity is null))))
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null, alt_text text check (char_length(alt_text) <= 180), position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), unique (product_id, storage_path)
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50), position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), unique (product_id, name)
);

create table public.product_option_values (
  id uuid primary key default gen_random_uuid(), option_id uuid not null references public.product_options(id) on delete cascade,
  value text not null check (char_length(value) between 1 and 80), position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), unique (option_id, value)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  sku text, option_value_ids uuid[] not null default '{}', price_cents bigint check (price_cents is null or price_cents >= 0),
  sale_price_cents bigint check (sale_price_cents is null or (sale_price_cents >= 0 and (price_cents is null or sale_price_cents < price_cents))),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (product_id, option_value_ids)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete restrict,
  order_number bigint generated always as identity, status public.order_status not null default 'new',
  customer_name text not null check (char_length(customer_name) between 2 and 120), customer_phone text not null check (char_length(customer_phone) between 8 and 30),
  customer_notes text check (char_length(customer_notes) <= 1000), subtotal_cents bigint not null check (subtotal_cents >= 0), total_cents bigint not null check (total_cents >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (store_id, order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null, sku text, unit_price_cents bigint not null check (unit_price_cents >= 0), quantity integer not null check (quantity > 0),
  line_total_cents bigint not null check (line_total_cents >= 0), created_at timestamptz not null default now()
);

create table public.order_item_options (
  id uuid primary key default gen_random_uuid(), order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_name text not null, option_value text not null, created_at timestamptz not null default now()
);

create index categories_store_idx on public.categories(store_id, position);
create index products_store_active_idx on public.products(store_id, is_active);
create index product_images_product_idx on public.product_images(product_id, position);
create index product_options_product_idx on public.product_options(product_id, position);
create index product_option_values_option_idx on public.product_option_values(option_id, position);
create index product_variants_product_idx on public.product_variants(product_id);
create index orders_store_created_idx on public.orders(store_id, created_at desc);
create index order_items_order_idx on public.order_items(order_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger stores_updated before update on public.stores for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger variants_updated before update on public.product_variants for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create function public.normalize_variant_values() returns trigger language plpgsql security definer set search_path = '' as $$
declare normalized uuid[];
begin
  select coalesce(array_agg(v.id order by v.id), '{}') into normalized
  from public.product_option_values v
  join public.product_options o on o.id = v.option_id
  where v.id = any(new.option_value_ids) and o.product_id = new.product_id;
  if cardinality(normalized) <> cardinality(new.option_value_ids) then
    raise exception 'Every option value must be unique and belong to the variant product';
  end if;
  new.option_value_ids = normalized;
  return new;
end; $$;
create trigger variants_normalize_values before insert or update of product_id, option_value_ids on public.product_variants
for each row execute function public.normalize_variant_values();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id, display_name) values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', '')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.owns_store(target_store_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.stores where id = target_store_id and owner_id = auth.uid());
$$;
create function public.product_is_public(target_product_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = target_product_id and p.is_active and s.is_active);
$$;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;

create policy "profiles own access" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "public active stores" on public.stores for select to anon, authenticated using (is_active or owner_id = auth.uid());
create policy "owners manage stores" on public.stores for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "public active categories" on public.categories for select to anon, authenticated using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_active));
create policy "owners manage categories" on public.categories for all to authenticated using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "public active products" on public.products for select to anon, authenticated using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_active));
create policy "owners manage products" on public.products for all to authenticated using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "public product images" on public.product_images for select to anon, authenticated using (public.product_is_public(product_id));
create policy "owners manage product images" on public.product_images for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "public product options" on public.product_options for select to anon, authenticated using (public.product_is_public(product_id));
create policy "owners manage product options" on public.product_options for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "public option values" on public.product_option_values for select to anon, authenticated using (exists (select 1 from public.product_options o where o.id = option_id and public.product_is_public(o.product_id)));
create policy "owners manage option values" on public.product_option_values for all to authenticated using (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and public.owns_store(p.store_id))) with check (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and public.owns_store(p.store_id)));
create policy "public active variants" on public.product_variants for select to anon, authenticated using (is_active and public.product_is_public(product_id));
create policy "owners manage variants" on public.product_variants for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "owners read orders" on public.orders for select to authenticated using (public.owns_store(store_id));
create policy "owners update orders" on public.orders for update to authenticated using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "owners read order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and public.owns_store(o.store_id)));
create policy "owners read order options" on public.order_item_options for select to authenticated using (exists (select 1 from public.order_items i join public.orders o on o.id = i.order_id where i.id = order_item_id and public.owns_store(o.store_id)));

revoke execute on function public.owns_store(uuid) from public;
grant execute on function public.owns_store(uuid) to anon, authenticated;
revoke execute on function public.product_is_public(uuid) from public;
grant execute on function public.product_is_public(uuid) to anon, authenticated;
