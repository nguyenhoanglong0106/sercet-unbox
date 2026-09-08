-- Chạy trong Supabase SQL Editor để bật đồng bộ thông tin xứ đoàn.
-- Có thể chạy lại nhiều lần, không thay đổi dữ liệu đã lưu.
create table if not exists public.organization_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default '',
  parish_name text not null default '',
  diocese text not null default '',
  academic_year text not null default '',
  slogan text not null default '',
  logo_url text not null default '',
  background_url text not null default '',
  church_image_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.organization_settings enable row level security;

grant select, insert, update on public.organization_settings to anon, authenticated;

drop policy if exists "Public can read organization settings" on public.organization_settings;
create policy "Public can read organization settings"
  on public.organization_settings for select
  using (true);

drop policy if exists "Public can insert organization settings" on public.organization_settings;
create policy "Public can insert organization settings"
  on public.organization_settings for insert
  with check (id = 1);

drop policy if exists "Public can update organization settings" on public.organization_settings;
create policy "Public can update organization settings"
  on public.organization_settings for update
  using (id = 1)
  with check (id = 1);
