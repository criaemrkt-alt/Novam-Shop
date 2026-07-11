create type public.cart_status as enum ('active', 'reminder_authorized', 'reminder_sent', 'recovered', 'converted', 'expired', 'cancelled');
create type public.reminder_status as enum ('pending', 'sent', 'cancelled', 'failed');
create type public.notification_status as enum ('draft', 'sent', 'cancelled');
create type public.delivery_status as enum ('pending', 'sent', 'failed', 'invalid_subscription');

create table public.store_notification_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  promotions_enabled boolean not null default true,
  cart_recovery_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 20 and 4000),
  p256dh text not null check (char_length(p256dh) between 20 and 500),
  auth_key text not null check (char_length(auth_key) between 8 and 500),
  user_agent text check (char_length(user_agent) <= 500),
  is_active boolean not null default true,
  expires_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, endpoint),
  unique (id, store_id)
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null unique references public.push_subscriptions(id) on delete cascade,
  promotions boolean not null default false,
  cart_reminders boolean not null default false,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  anonymous_token uuid not null,
  status public.cart_status not null default 'active',
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  reminder_authorized boolean not null default false,
  recovered_at timestamptz,
  converted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, anonymous_token),
  unique (id, store_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null check (char_length(product_name) between 1 and 160),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  selected_options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (cart_id, product_id, variant_id)
);

create table public.cart_reminders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  reminder_number smallint not null check (reminder_number in (1, 2)),
  status public.reminder_status not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  failure_reason text check (char_length(failure_reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, reminder_number)
);

create table public.promotional_notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  message text not null check (char_length(message) between 2 and 240),
  target_url text check (char_length(target_url) <= 2000),
  product_id uuid references public.products(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status public.notification_status not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  promotional_notification_id uuid references public.promotional_notifications(id) on delete cascade,
  cart_reminder_id uuid references public.cart_reminders(id) on delete cascade,
  status public.delivery_status not null default 'pending',
  provider_message text check (char_length(provider_message) <= 1000),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint delivery_exactly_one_source check (num_nonnulls(promotional_notification_id, cart_reminder_id) = 1),
  unique (subscription_id, promotional_notification_id),
  unique (subscription_id, cart_reminder_id)
);

create index push_subscriptions_store_active_idx on public.push_subscriptions(store_id, is_active);
create index carts_store_status_updated_idx on public.carts(store_id, status, updated_at desc);
create index cart_items_cart_idx on public.cart_items(cart_id);
create index cart_reminders_due_idx on public.cart_reminders(status, scheduled_for) where status = 'pending';
create index promotions_store_created_idx on public.promotional_notifications(store_id, created_at desc);
create index notification_deliveries_store_created_idx on public.notification_deliveries(store_id, created_at desc);

create trigger store_notification_settings_updated before update on public.store_notification_settings for each row execute function public.set_updated_at();
create trigger push_subscriptions_updated before update on public.push_subscriptions for each row execute function public.set_updated_at();
create trigger notification_preferences_updated before update on public.notification_preferences for each row execute function public.set_updated_at();
create trigger carts_updated before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_updated before update on public.cart_items for each row execute function public.set_updated_at();
create trigger cart_reminders_updated before update on public.cart_reminders for each row execute function public.set_updated_at();
create trigger promotional_notifications_updated before update on public.promotional_notifications for each row execute function public.set_updated_at();

create function public.enforce_weekly_promotion_limit() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'sent' and old.status is distinct from 'sent' then
    if exists (
      select 1 from public.promotional_notifications p
      where p.store_id = new.store_id and p.status = 'sent'
        and p.id <> new.id and p.sent_at > now() - interval '7 days'
    ) then raise exception 'Only one promotional notification per store is allowed every 7 days';
    end if;
    new.sent_at = coalesce(new.sent_at, now());
  end if;
  return new;
end; $$;
create trigger promotional_notifications_weekly_limit before insert or update of status on public.promotional_notifications for each row execute function public.enforce_weekly_promotion_limit();

insert into public.store_notification_settings (store_id)
select id from public.stores on conflict (store_id) do nothing;

create function public.create_store_notification_settings() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.store_notification_settings (store_id) values (new.id); return new; end; $$;
create trigger stores_create_notification_settings after insert on public.stores for each row execute function public.create_store_notification_settings();

create function public.register_push_subscription(
  p_store_id uuid, p_endpoint text, p_p256dh text, p_auth_key text, p_user_agent text,
  p_promotions boolean, p_cart_reminders boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare subscription_id uuid;
begin
  if not exists (select 1 from public.stores s where s.id = p_store_id and s.is_active) then raise exception 'Store unavailable'; end if;
  if char_length(p_endpoint) not between 20 and 4000 or char_length(p_p256dh) not between 20 and 500 or char_length(p_auth_key) not between 8 and 500 then raise exception 'Invalid subscription'; end if;
  insert into public.push_subscriptions (store_id, endpoint, p256dh, auth_key, user_agent, is_active, last_seen_at)
  values (p_store_id, p_endpoint, p_p256dh, p_auth_key, left(p_user_agent, 500), true, now())
  on conflict (store_id, endpoint) do update set p256dh = excluded.p256dh, auth_key = excluded.auth_key, user_agent = excluded.user_agent, is_active = true, last_seen_at = now(), expires_at = null
  returning id into subscription_id;
  insert into public.notification_preferences (subscription_id, promotions, cart_reminders, consented_at, revoked_at)
  values (subscription_id, p_promotions, p_cart_reminders, now(), null)
  on conflict (subscription_id) do update set promotions = excluded.promotions, cart_reminders = excluded.cart_reminders, consented_at = now(), revoked_at = null;
  return subscription_id;
end; $$;

create function public.sync_anonymous_cart(p_store_id uuid, p_anonymous_token uuid, p_items jsonb)
returns table(cart_id uuid, subtotal_cents bigint) language plpgsql security definer set search_path = '' as $$
declare current_cart_id uuid; item jsonb; current_product record; requested_quantity integer; computed_subtotal bigint := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'Invalid cart'; end if;
  if not exists (select 1 from public.stores s where s.id = p_store_id and s.is_active) then raise exception 'Store unavailable'; end if;
  insert into public.carts (store_id, anonymous_token, status, expires_at)
  values (p_store_id, p_anonymous_token, 'active', now() + interval '30 days')
  on conflict (store_id, anonymous_token) do update set status = case when public.carts.status in ('converted','cancelled') then 'active' else public.carts.status end, expires_at = now() + interval '30 days'
  returning id into current_cart_id;
  delete from public.cart_items where cart_id = current_cart_id;
  for item in select value from jsonb_array_elements(p_items) loop
    requested_quantity := greatest(1, least(99, coalesce((item->>'quantity')::integer, 1)));
    select p.id, p.name, coalesce(p.sale_price_cents, p.price_cents) as unit_price, p.track_stock, p.stock_quantity into current_product
    from public.products p where p.id = (item->>'product_id')::uuid and p.store_id = p_store_id and p.is_active;
    if found then
      if current_product.track_stock then requested_quantity := least(requested_quantity, coalesce(current_product.stock_quantity, 0)); end if;
      if requested_quantity > 0 then
        insert into public.cart_items (cart_id, product_id, product_name, unit_price_cents, quantity)
        values (current_cart_id, current_product.id, current_product.name, current_product.unit_price, requested_quantity);
        computed_subtotal := computed_subtotal + current_product.unit_price * requested_quantity;
      end if;
    end if;
  end loop;
  update public.carts set subtotal_cents = computed_subtotal, status = case when computed_subtotal = 0 then 'cancelled'::public.cart_status else 'active'::public.cart_status end where id = current_cart_id;
  return query select current_cart_id, computed_subtotal;
end; $$;

alter table public.store_notification_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.cart_reminders enable row level security;
alter table public.promotional_notifications enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "public reads enabled notification settings" on public.store_notification_settings for select to anon, authenticated
using (exists (select 1 from public.stores s where s.id = store_id and s.is_active));
create policy "owners manage notification settings" on public.store_notification_settings for all to authenticated
using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- Push endpoints and preference keys are intentionally not directly readable by store owners.
-- They will only be accessed by audited security-definer RPCs and the server-side sender.

create policy "owners read anonymous carts" on public.carts for select to authenticated using (public.owns_store(store_id));
create policy "owners read anonymous cart items" on public.cart_items for select to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and public.owns_store(c.store_id)));
create policy "owners read cart reminders" on public.cart_reminders for select to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and public.owns_store(c.store_id)));
create policy "owners manage promotions" on public.promotional_notifications for all to authenticated
using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "owners read notification deliveries" on public.notification_deliveries for select to authenticated
using (public.owns_store(store_id));

revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.notification_preferences from anon, authenticated;

revoke execute on function public.register_push_subscription(uuid,text,text,text,text,boolean,boolean) from public;
grant execute on function public.register_push_subscription(uuid,text,text,text,text,boolean,boolean) to anon, authenticated;
revoke execute on function public.sync_anonymous_cart(uuid,uuid,jsonb) from public;
grant execute on function public.sync_anonymous_cart(uuid,uuid,jsonb) to anon, authenticated;
