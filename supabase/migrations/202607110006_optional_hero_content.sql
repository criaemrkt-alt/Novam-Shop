-- Allow merchants to use the banner artwork without overlaid copy or CTA.
alter table public.stores
  add column if not exists show_hero_content boolean not null default true;

comment on column public.stores.show_hero_content is
  'Controls whether the public banner displays its headline, label and catalog CTA.';
