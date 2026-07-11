create type public.subscription_plan as enum ('monthly', 'annual', 'custom');
create type public.financial_status as enum ('trial', 'active', 'past_due', 'suspended', 'cancelled');
create type public.store_publication_status as enum ('draft', 'published', 'suspended');

alter table public.profiles
  add column email text,
  add column last_activity_at timestamptz not null default now();

update public.profiles p set email = u.email from auth.users u where u.id = p.id;
revoke update (email) on public.profiles from authenticated;

alter table public.stores
  add column publication_status public.store_publication_status not null default 'draft';
update public.stores set publication_status = case when is_active then 'published'::public.store_publication_status else 'draft'::public.store_publication_status end;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  store_id uuid unique references public.stores(id) on delete cascade,
  plan public.subscription_plan not null default 'monthly',
  financial_status public.financial_status not null default 'trial',
  started_at timestamptz not null default now(),
  next_due_at timestamptz,
  last_payment_at timestamptz,
  grace_period_days integer not null default 0 check (grace_period_days between 0 and 60),
  amount_cents bigint not null default 2990 check (amount_cents >= 0),
  payment_method text check (char_length(payment_method) <= 80),
  internal_notes text check (char_length(internal_notes) <= 5000),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(user_id) on delete restrict,
  action text not null check (char_length(action) between 2 and 80),
  affected_user_id uuid references public.profiles(id) on delete set null,
  affected_store_id uuid references public.stores(id) on delete set null,
  previous_value jsonb,
  new_value jsonb,
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create index subscriptions_status_due_idx on public.subscriptions(financial_status, next_due_at);
create index subscriptions_store_idx on public.subscriptions(store_id);
create index admin_audit_store_created_idx on public.admin_audit_logs(affected_store_id, created_at desc);
create index admin_audit_user_created_idx on public.admin_audit_logs(affected_user_id, created_at desc);

create trigger admin_users_updated before update on public.admin_users for each row execute function public.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();

create function public.is_master_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.is_active);
$$;

create function public.can_manage_store(target_store_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.id = target_store_id and s.owner_id = auth.uid() and s.publication_status <> 'suspended'
  );
$$;

create function public.touch_last_activity() returns void language sql security definer set search_path = '' as $$
  update public.profiles set last_activity_at = now() where id = auth.uid() and last_activity_at < now() - interval '5 minutes';
$$;

create function public.master_alert_metrics()
returns table(due_soon bigint, overdue bigint, suspended_stores bigint, trials bigint, recent_payments bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_master_admin() then raise exception 'Forbidden'; end if;
  return query select
    (select count(*) from public.subscriptions s where s.next_due_at between now() and now() + interval '7 days'),
    (select count(*) from public.subscriptions s where s.next_due_at < now() and s.financial_status <> 'cancelled'),
    (select count(*) from public.stores s where s.publication_status = 'suspended'),
    (select count(*) from public.subscriptions s where s.financial_status = 'trial'),
    (select count(*) from public.subscriptions s where s.last_payment_at > now() - interval '7 days');
end; $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, email) values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''), new.email);
  return new;
end; $$;

create function public.create_store_subscription() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscriptions (user_id, store_id, plan, financial_status, amount_cents)
  values (new.owner_id, new.id, 'monthly', 'trial', 2990)
  on conflict (user_id) do update set store_id = excluded.store_id;
  return new;
end; $$;
create trigger stores_create_subscription after insert on public.stores for each row execute function public.create_store_subscription();

insert into public.subscriptions (user_id, store_id, plan, financial_status, amount_cents, started_at)
select s.owner_id, s.id, 'monthly', 'trial', 2990, s.created_at from public.stores s
on conflict (user_id) do update set store_id = excluded.store_id;

create function public.get_public_store_state(p_slug text)
returns table(name text, publication_status public.store_publication_status)
language sql stable security definer set search_path = '' as $$
  select s.name, s.publication_status from public.stores s where s.slug = p_slug limit 1;
$$;

create function public.block_unavailable_commerce() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('active', 'reminder_authorized') and not exists (select 1 from public.stores s where s.id = new.store_id and s.is_active and s.publication_status = 'published') then
    raise exception 'Store is not available for commerce';
  end if;
  return new;
end; $$;
create trigger carts_require_published_store before insert or update on public.carts for each row execute function public.block_unavailable_commerce();

create function public.master_update_account(
  p_store_id uuid,
  p_action text,
  p_reason text default null,
  p_plan public.subscription_plan default null,
  p_financial_status public.financial_status default null,
  p_publication_status public.store_publication_status default null,
  p_next_due_at timestamptz default null,
  p_amount_cents bigint default null,
  p_payment_method text default null,
  p_grace_period_days integer default null,
  p_internal_notes text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare target_store public.stores; target_subscription public.subscriptions; old_value jsonb; new_value jsonb;
begin
  if not public.is_master_admin() then raise exception 'Forbidden'; end if;
  select * into target_store from public.stores where id = p_store_id for update;
  if not found then raise exception 'Store not found'; end if;
  select * into target_subscription from public.subscriptions where store_id = p_store_id for update;
  old_value := jsonb_build_object('publication_status', target_store.publication_status, 'is_active', target_store.is_active, 'plan', target_subscription.plan, 'financial_status', target_subscription.financial_status, 'next_due_at', target_subscription.next_due_at, 'last_payment_at', target_subscription.last_payment_at, 'amount_cents', target_subscription.amount_cents, 'payment_method', target_subscription.payment_method, 'grace_period_days', target_subscription.grace_period_days, 'internal_notes', target_subscription.internal_notes);

  if p_action = 'suspend_store' then
    update public.stores set publication_status = 'suspended' where id = p_store_id;
  elsif p_action = 'reactivate_store' then
    update public.stores set publication_status = coalesce(p_publication_status, 'published') where id = p_store_id;
  elsif p_action = 'cancel_account' then
    update public.stores set publication_status = 'suspended' where id = p_store_id;
    update public.subscriptions set financial_status = 'cancelled', cancelled_at = now() where store_id = p_store_id;
  elsif p_action = 'confirm_payment' then
    update public.subscriptions set financial_status = 'active', last_payment_at = now(), next_due_at = coalesce(p_next_due_at, next_due_at), amount_cents = coalesce(p_amount_cents, amount_cents), payment_method = coalesce(nullif(p_payment_method, ''), payment_method), cancelled_at = null where store_id = p_store_id;
  elsif p_action = 'update_subscription' then
    update public.subscriptions set plan = coalesce(p_plan, plan), financial_status = coalesce(p_financial_status, financial_status), next_due_at = p_next_due_at, amount_cents = coalesce(p_amount_cents, amount_cents), payment_method = nullif(p_payment_method, ''), grace_period_days = coalesce(p_grace_period_days, grace_period_days), internal_notes = p_internal_notes where store_id = p_store_id;
    if p_publication_status is not null then update public.stores set publication_status = p_publication_status where id = p_store_id; end if;
  else raise exception 'Unsupported action';
  end if;

  select * into target_store from public.stores where id = p_store_id;
  select * into target_subscription from public.subscriptions where store_id = p_store_id;
  new_value := jsonb_build_object('publication_status', target_store.publication_status, 'is_active', target_store.is_active, 'plan', target_subscription.plan, 'financial_status', target_subscription.financial_status, 'next_due_at', target_subscription.next_due_at, 'last_payment_at', target_subscription.last_payment_at, 'amount_cents', target_subscription.amount_cents, 'payment_method', target_subscription.payment_method, 'grace_period_days', target_subscription.grace_period_days, 'internal_notes', target_subscription.internal_notes);
  insert into public.admin_audit_logs (admin_user_id, action, affected_user_id, affected_store_id, previous_value, new_value, reason)
  values (auth.uid(), p_action, target_store.owner_id, p_store_id, old_value, new_value, nullif(p_reason, ''));
end; $$;

alter table public.admin_users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "master reads admin users" on public.admin_users for select to authenticated using (public.is_master_admin());
create policy "users read own subscription" on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "master manages subscriptions" on public.subscriptions for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
create policy "master reads audit logs" on public.admin_audit_logs for select to authenticated using (public.is_master_admin());
create policy "master reads profiles" on public.profiles for select to authenticated using (public.is_master_admin());
create policy "master manages stores" on public.stores for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

drop policy if exists "owners manage stores" on public.stores;
create policy "owners create stores" on public.stores for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update available stores" on public.stores for update to authenticated using (owner_id = auth.uid() and publication_status <> 'suspended') with check (owner_id = auth.uid() and publication_status <> 'suspended');

create or replace function public.product_is_public(target_product_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = target_product_id and p.is_active and s.is_active and s.publication_status = 'published');
$$;

drop policy if exists "public active stores" on public.stores;
create policy "public published stores" on public.stores for select to anon, authenticated using ((is_active and publication_status = 'published') or owner_id = auth.uid() or public.is_master_admin());
drop policy if exists "public active categories" on public.categories;
create policy "public active categories" on public.categories for select to anon, authenticated using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_active and s.publication_status = 'published'));
drop policy if exists "public active products" on public.products;
create policy "public active products" on public.products for select to anon, authenticated using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_active and s.publication_status = 'published'));

drop policy if exists "owners manage categories" on public.categories;
create policy "owners read own categories" on public.categories for select to authenticated using (public.owns_store(store_id));
create policy "owners manage available categories" on public.categories for insert to authenticated with check (public.can_manage_store(store_id));
create policy "owners update available categories" on public.categories for update to authenticated using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "owners delete available categories" on public.categories for delete to authenticated using (public.can_manage_store(store_id));

drop policy if exists "owners manage products" on public.products;
create policy "owners read own products" on public.products for select to authenticated using (public.owns_store(store_id));
create policy "owners manage available products" on public.products for insert to authenticated with check (public.can_manage_store(store_id));
create policy "owners update available products" on public.products for update to authenticated using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "owners delete available products" on public.products for delete to authenticated using (public.can_manage_store(store_id));

drop policy if exists "owners manage product images" on public.product_images;
create policy "owners read own product images" on public.product_images for select to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "owners manage available product images" on public.product_images for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id)));

drop policy if exists "owners manage product options" on public.product_options;
create policy "owners read own product options" on public.product_options for select to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "owners manage available product options" on public.product_options for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id)));

drop policy if exists "owners manage option values" on public.product_option_values;
create policy "owners read own option values" on public.product_option_values for select to authenticated using (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and public.owns_store(p.store_id)));
create policy "owners manage available option values" on public.product_option_values for all to authenticated using (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and public.can_manage_store(p.store_id))) with check (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and public.can_manage_store(p.store_id)));

drop policy if exists "owners manage variants" on public.product_variants;
create policy "owners read own variants" on public.product_variants for select to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.owns_store(p.store_id)));
create policy "owners manage available variants" on public.product_variants for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_store(p.store_id)));

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_audit_logs from anon, authenticated;
revoke execute on function public.is_master_admin() from public;
grant execute on function public.is_master_admin() to authenticated;
revoke execute on function public.can_manage_store(uuid) from public;
grant execute on function public.can_manage_store(uuid) to authenticated;
revoke execute on function public.touch_last_activity() from public;
grant execute on function public.touch_last_activity() to authenticated;
revoke execute on function public.master_alert_metrics() from public;
grant execute on function public.master_alert_metrics() to authenticated;
revoke execute on function public.get_public_store_state(text) from public;
grant execute on function public.get_public_store_state(text) to anon, authenticated;
revoke execute on function public.master_update_account(uuid,text,text,public.subscription_plan,public.financial_status,public.store_publication_status,timestamptz,bigint,text,integer,text) from public;
grant execute on function public.master_update_account(uuid,text,text,public.subscription_plan,public.financial_status,public.store_publication_status,timestamptz,bigint,text,integer,text) to authenticated;
