alter table public.stores
  add column theme_preset text not null default 'novam',
  add column theme_primary text not null default '#083D40',
  add column theme_accent text not null default '#1F4D4F',
  add column theme_background text not null default '#FAF9F6',
  add column theme_text text not null default '#111111';

alter table public.stores
  add constraint stores_theme_preset_length check (char_length(theme_preset) between 2 and 30),
  add constraint stores_theme_primary_hex check (theme_primary ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint stores_theme_accent_hex check (theme_accent ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint stores_theme_background_hex check (theme_background ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint stores_theme_text_hex check (theme_text ~ '^#[0-9A-Fa-f]{6}$');
