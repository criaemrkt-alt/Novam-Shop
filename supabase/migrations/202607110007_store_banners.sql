-- Responsive storefront carousel with at most five ordered banners per store.
create table if not exists public.store_banners (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  desktop_path text not null,
  mobile_path text,
  position smallint not null check (position between 0 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, position)
);

insert into public.store_banners (store_id, desktop_path, position)
select id, banner_path, 0
from public.stores
where banner_path is not null
on conflict (store_id, position) do nothing;

alter table public.store_banners enable row level security;

drop policy if exists "public reads published store banners" on public.store_banners;
create policy "public reads published store banners"
on public.store_banners for select
to anon, authenticated
using (
  exists (
    select 1 from public.stores s
    where s.id = store_id
      and s.is_active
      and s.publication_status = 'published'
  )
);

drop policy if exists "master reads store banners" on public.store_banners;
create policy "master reads store banners"
on public.store_banners for select
to authenticated
using (public.is_master_admin());

drop policy if exists "owners manage available store banners" on public.store_banners;
create policy "owners manage available store banners"
on public.store_banners for all
to authenticated
using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

drop trigger if exists store_banners_set_updated_at on public.store_banners;
create trigger store_banners_set_updated_at
before update on public.store_banners
for each row execute function public.set_updated_at();

create index if not exists store_banners_store_position_idx
  on public.store_banners (store_id, position);

comment on table public.store_banners is
  'Up to five ordered storefront banners, each with a required desktop image and optional mobile image.';
