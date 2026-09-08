-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor > New query > Run.
-- An toàn để chạy lại nhiều lần (dùng if not exists / on conflict).

-- 1. Bảng danh sách lớp (thay thế IndexedDB local trước đây)
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null default '',
  division text not null default 'THIEU_NHI',
  group_name text not null default '',
  teacher_name text not null default '',
  assistant_name text not null default '',
  teacher_image text not null default '',
  assistant_image text not null default '',
  class_image text not null default '',
  slogan text not null default '',
  primary_color text not null default '',
  notes text not null default '',
  order_index integer not null default 0,
  revealed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.classes enable row level security;

drop policy if exists "Public can read classes" on public.classes;
create policy "Public can read classes"
  on public.classes for select
  using (true);

drop policy if exists "Public can insert classes" on public.classes;
create policy "Public can insert classes"
  on public.classes for insert
  with check (true);

drop policy if exists "Public can update classes" on public.classes;
create policy "Public can update classes"
  on public.classes for update
  using (true)
  with check (true);

drop policy if exists "Public can delete classes" on public.classes;
create policy "Public can delete classes"
  on public.classes for delete
  using (true);

-- 2. Bật realtime (không bắt buộc với bản hiện tại, nhưng để sẵn cho sau này
-- nếu muốn thêm xem trực tiếp đồng bộ).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'classes'
  ) then
    alter publication supabase_realtime add table public.classes;
  end if;
end $$;

-- 3. Storage bucket lưu ảnh giáo lý viên / lớp (thay thế base64 trong trình duyệt)
insert into storage.buckets (id, name, public)
values ('class-photos', 'class-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can read class photos" on storage.objects;
create policy "Public can read class photos"
  on storage.objects for select
  using (bucket_id = 'class-photos');

drop policy if exists "Public can upload class photos" on storage.objects;
create policy "Public can upload class photos"
  on storage.objects for insert
  with check (bucket_id = 'class-photos');

drop policy if exists "Public can update class photos" on storage.objects;
create policy "Public can update class photos"
  on storage.objects for update
  using (bucket_id = 'class-photos');

drop policy if exists "Public can delete class photos" on storage.objects;
create policy "Public can delete class photos"
  on storage.objects for delete
  using (bucket_id = 'class-photos');

-- 4. Thông tin chung của xứ đoàn (một bản ghi dùng chung cho toàn ứng dụng).
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
