-- Optional structured content for the reusable product sales page.
alter table public.products
  add column if not exists materials text,
  add column if not exists lead_time text,
  add column if not exists customization_notes text;

alter table public.products
  drop constraint if exists products_materials_length,
  add constraint products_materials_length
    check (materials is null or char_length(materials) <= 500),
  drop constraint if exists products_lead_time_length,
  add constraint products_lead_time_length
    check (lead_time is null or char_length(lead_time) <= 300),
  drop constraint if exists products_customization_notes_length,
  add constraint products_customization_notes_length
    check (customization_notes is null or char_length(customization_notes) <= 1000);

comment on column public.products.materials is 'Optional materials and finish information shown on the product sales page.';
comment on column public.products.lead_time is 'Optional production or dispatch lead time shown on the product sales page.';
comment on column public.products.customization_notes is 'Optional personalization guidance shown on the product sales page.';
