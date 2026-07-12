-- Separate the storefront hero copy from the full store description.
alter table public.stores
  add column if not exists hero_title text,
  add column if not exists subtitle text;

alter table public.stores
  drop constraint if exists stores_hero_title_length,
  add constraint stores_hero_title_length
    check (hero_title is null or char_length(hero_title) <= 100),
  drop constraint if exists stores_subtitle_length,
  add constraint stores_subtitle_length
    check (subtitle is null or char_length(subtitle) <= 180);

comment on column public.stores.hero_title is
  'Short commercial headline displayed over the public storefront banner.';

comment on column public.stores.subtitle is
  'Short supporting line displayed immediately below the storefront banner.';
