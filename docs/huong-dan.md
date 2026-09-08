# Hướng Dẫn Sử Dụng — Xé Túi Mù

Tài liệu này viết cho người **chưa từng dùng các công cụ lập trình**. Cứ làm theo từng bước
theo đúng thứ tự, không cần hiểu sâu, mọi thứ sẽ chạy được.

Ứng dụng gồm 2 phần:

1. **Phần "kho dữ liệu"** (Supabase) — nơi lưu danh sách lớp, ảnh giáo lý viên, thông tin xứ đoàn.
   Miễn phí, chỉ cần làm 1 lần.
2. **Phần "trang web"** (Cloudflare Pages) — nơi mọi người truy cập để xem/trình chiếu.
   Miễn phí, chỉ cần làm 1 lần.

Sau khi làm xong 2 phần trên, những năm sau **không cần làm lại** — chỉ cần vào trang quản trị
để cập nhật danh sách lớp mới.

---

## Mục lục

1. [Chuẩn bị tài khoản](#1-chuẩn-bị-tài-khoản)
2. [Tạo "kho dữ liệu" trên Supabase](#2-tạo-kho-dữ-liệu-trên-supabase)
3. [Đưa ứng dụng lên Cloudflare Pages](#3-đưa-ứng-dụng-lên-cloudflare-pages)
4. [Thiết lập thông tin xứ đoàn](#4-thiết-lập-thông-tin-xứ-đoàn)
5. [Quản lý lớp — tạo lớp thủ công](#5-quản-lý-lớp--tạo-lớp-thủ-công)
6. [Import danh sách Giáo Lý Viên từ Excel](#6-import-danh-sách-giáo-lý-viên-từ-excel)
7. [Trình chiếu — cách "xé túi mù" trong đêm diễn ra](#7-trình-chiếu--cách-xé-túi-mù-trong-đêm-diễn-ra)
8. [Xử lý sự cố thường gặp](#8-xử-lý-sự-cố-thường-gặp)

---

## 1. Chuẩn bị tài khoản

Cần 2 tài khoản, đều **miễn phí**, đăng ký bằng email hoặc tài khoản Google có sẵn:

- **Supabase**: vào [supabase.com](https://supabase.com) → bấm **Start your project** → đăng nhập
  bằng Google hoặc GitHub.
- **Cloudflare**: vào [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) → đăng ký
  bằng email.

Làm xong bước này rồi mới qua Phần 2.

---

## 2. Tạo "kho dữ liệu" trên Supabase

### 2.1. Tạo project mới

1. Đăng nhập [supabase.com](https://supabase.com/dashboard).
2. Bấm nút **New project**.
3. Điền:
   - **Name**: đặt tên gì cũng được, ví dụ `giao-ly-bac-than`.
   - **Database Password**: bấm **Generate a password** cho nhanh, rồi **lưu lại** mật khẩu này
     vào một nơi an toàn (không cần dùng ngay, nhưng nên giữ phòng khi cần).
   - **Region**: chọn khu vực gần Việt Nam nhất, ví dụ `Southeast Asia (Singapore)`.
4. Bấm **Create new project**. Đợi khoảng 1–2 phút để Supabase khởi tạo xong (có thanh tiến trình
   hiển thị "Setting up project...").

### 2.2. Tạo bảng dữ liệu (chạy 1 đoạn lệnh có sẵn)

Đây là bước quan trọng nhất — chỉ cần **copy** và **dán**, không cần hiểu nội dung.

1. Ở menu bên trái, bấm biểu tượng **SQL Editor** (hình `</>`)
2. Bấm **New query** (góc trên bên trái vùng soạn thảo).
3. **Vào ứng dụng Xé Túi Mù → tab "Hướng dẫn" → mục "Tạo bảng dữ liệu"**, bấm nút **Copy** để
   sao chép toàn bộ đoạn lệnh SQL. (Nếu chưa deploy app, dùng đoạn SQL dán sẵn bên dưới mục
   [2.3](#23-nội-dung-lệnh-sql-để-dự-phòng) trong tài liệu này.)
4. Dán đoạn lệnh vừa copy vào ô soạn thảo trống trong SQL Editor (Ctrl+V).
5. Bấm nút **Run** (hoặc phím tắt Ctrl+Enter) ở góc dưới bên phải.
6. Thấy dòng chữ **Success. No rows returned** màu xanh lá là xong. Nếu chạy lại lần nữa cũng
   không sao, không bị lỗi hay mất dữ liệu.

> Đoạn lệnh này tạo ra: bảng `classes` (danh sách lớp), bảng `organization_settings` (thông tin
> xứ đoàn), và một "kho ảnh" (Storage) tên `class-photos` để lưu ảnh giáo lý viên.

### 2.3. Nội dung lệnh SQL (để dự phòng)

Nếu chưa mở được ứng dụng để copy, có thể copy trực tiếp đoạn dưới đây:

```sql
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
```

### 2.4. Lấy 2 mã kết nối (URL và Anon Key)

1. Ở menu bên trái Supabase, bấm biểu tượng bánh răng **Project Settings**.
2. Chọn mục **Data API** (hoặc **API** tùy phiên bản).
3. Sao chép và lưu lại 2 giá trị:
   - **Project URL** — dạng `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key (trong mục **Project API keys**) — một chuỗi ký tự rất dài bắt đầu bằng
     `eyJ...`
4. Dán 2 giá trị này vào một file text tạm (Notepad) để dùng ở bước tiếp theo — **không chia sẻ**
   2 giá trị này cho người lạ.

---

## 3. Đưa ứng dụng lên Cloudflare Pages

### 3.1. Tải mã nguồn lên GitHub (nếu chưa có)

Nếu người hỗ trợ kỹ thuật (ví dụ Claude Code) đã đẩy sẵn mã nguồn lên GitHub cho bạn, bỏ qua mục
này và làm tiếp mục 3.2.

Nếu chưa có, cần một repository (kho chứa mã nguồn) trên [github.com](https://github.com) chứa
toàn bộ thư mục dự án này.

### 3.2. Tạo trang trên Cloudflare Pages

1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com).
2. Ở menu bên trái, chọn **Workers & Pages**.
3. Bấm **Create application** → tab **Pages** → **Connect to Git**.
4. Chọn repository GitHub chứa mã nguồn ứng dụng này → bấm **Begin setup**.
5. Ở phần **Build settings**, điền đúng:
   - **Framework preset**: chọn `Vite` (nếu không có, để `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. **Chưa bấm Save and Deploy vội** — cuộn xuống mục **Environment variables (advanced)** để làm
   tiếp bước 3.3.

### 3.3. Gắn biến môi trường (Environment variables)

"Biến môi trường" là nơi giấu 2 mã kết nối Supabase đã lưu ở bước 2.4, để không bị lộ ra ngoài mã
nguồn công khai.

Ở mục **Environment variables**, bấm **Add variable** 2 lần và điền:

| Variable name             | Value                                    |
| -------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`        | Project URL đã copy ở bước 2.4            |
| `VITE_SUPABASE_ANON_KEY`   | anon public key đã copy ở bước 2.4        |

Chỉ cần đúng 2 biến này. **Không** thêm `CLOUDFLARE_API_TOKEN` hay `CLOUDFLARE_ACCOUNT_ID` — thêm
vào sẽ làm bước deploy báo lỗi `Authentication error [code: 10000]`.

Sau đó bấm **Save and Deploy**. Đợi khoảng 1–3 phút, Cloudflare sẽ build và cấp cho bạn một đường
link dạng `https://ten-du-an.pages.dev` — đây chính là trang web để dùng.

> Nếu sau này cần đổi mã kết nối Supabase, vào **Workers & Pages → chọn project → Settings →
> Environment variables** để sửa, sau đó vào tab **Deployments** bấm **Retry deployment** (hoặc
> đẩy code mới lên GitHub) để áp dụng.

### 3.4. Chạy thử trên máy tính cá nhân (không bắt buộc)

Nếu muốn thử trước khi lên mạng, hoặc cho lập trình viên/người hỗ trợ kỹ thuật:

```bash
npm install
```

Tạo file `.env` (copy từ file `.env.example`), điền 2 giá trị đã lấy ở bước 2.4, sau đó:

```bash
npm run dev
```

---

## 4. Thiết lập thông tin xứ đoàn

Vào trang quản trị (đường link Cloudflare vừa tạo, thêm `/setup` phía sau, ví dụ
`https://ten-du-an.pages.dev/setup`) → chọn tab **Thông tin xứ đoàn**.

Điền các trường:

- **Tên xứ đoàn** *(bắt buộc)* — ví dụ "Đoàn Thiếu Nhi Thánh Thể Đaminh Saviô".
- **Giáo xứ** *(bắt buộc)*.
- **Giáo phận** — có thể để trống nếu không cần hiện.
- **Niên khóa** *(bắt buộc)* — ví dụ "2026 - 2027".
- **Khẩu hiệu xứ đoàn** — câu khẩu hiệu chung, hiện trên poster nếu lớp không có khẩu hiệu riêng.

Phần **Hình ảnh**, với mỗi ảnh (Logo xứ đoàn / Ảnh nền trình chiếu / Ảnh nhà thờ) có thể:

- Bấm **Tải ảnh lên** để chọn ảnh từ máy tính (tối đa 10 MB, nhận PNG/JPG/WebP/TIFF).
- Hoặc dán trực tiếp đường link ảnh (https://...) vào ô bên cạnh.
- Bấm nút hình mũi tên xoay tròn để **khôi phục ảnh mặc định** nếu muốn quay lại ảnh gốc.

Khung **Xem trước** bên phải cập nhật ngay khi gõ, giúp thấy Poster/Túi mù trông ra sao trước khi
lưu.

Bấm **Lưu thông tin** để áp dụng cho toàn bộ ứng dụng (Presenter, trang kết quả, poster tải về).
Nếu tạm thời mất mạng, ứng dụng sẽ báo "chưa đồng bộ" và tự lưu trên máy hiện tại — khi có mạng
lại, bấm **Thử đồng bộ**.

---

## 5. Quản lý lớp — tạo lớp thủ công

Ở trang quản trị, chọn tab **Quản lý lớp**. Cột bên trái là form **Thêm lớp**:

- **Tên lớp** *(bắt buộc)* — ví dụ "Thiếu Nhi 1A".
- **Khối / Ngành** — chọn 1 trong 5 ngành (Chiên Con / Ấu Nhi / Thiếu Nhi / Nghĩa Sĩ / Hiệp Sĩ).
  Ảnh minh họa trên Poster sẽ tự đổi theo ngành.
- **Giáo lý viên chính / phụ** — gõ tên đầy đủ (Tên Thánh + Họ Tên), ví dụ "Giuse Nguyễn Văn A".
  Để trống ô "phụ" nếu lớp chỉ có 1 giáo lý viên.
- **Câu khẩu hiệu** — riêng cho lớp này (ưu tiên hơn khẩu hiệu chung của xứ đoàn).
- **Màu chủ đạo** — tự động theo ngành, có thể đổi tùy ý.
- **Hình GLV chính / phụ** — bấm vào ô để chọn ảnh từ máy tính. Ảnh sau khi chọn hiện luôn trong
  ô, có dấu ✓ xanh xác nhận đã có ảnh thật (không dùng ảnh mặc định). Bấm dấu **X** đỏ ở góc để
  xóa ảnh, quay về icon mặc định.

Bấm **Thêm lớp** để lưu. Muốn sửa lớp đã có, bấm biểu tượng bút chì trên card lớp đó ở cột bên
phải; muốn xóa, bấm biểu tượng thùng rác.

Có thể lọc danh sách theo ngành bằng ô chọn phía trên danh sách lớp, và bấm **Reset** để đưa toàn
bộ túi mù về trạng thái "chưa mở" (dùng khi cần trình chiếu lại từ đầu).

---

## 6. Import danh sách Giáo Lý Viên từ Excel

Nếu đã có sẵn file Excel danh sách giáo lý viên (theo mẫu chung của xứ đoàn), có thể nhập nhanh
thay vì gõ tay từng lớp.

### 6.1. Yêu cầu file Excel

File cần có các cột (tên cột không phân biệt chính xác 100%, ứng dụng tự nhận diện các cột gần
giống): **Tên Thánh**, **Họ**, **Tên**, **Lớp đang dạy**, **Tình trạng**.

Ứng dụng chỉ lấy những người có cột **Tình trạng** ghi đúng "**Bình thường**" — những người ghi
"Nghỉ luôn", "Tạm nghỉ", "Chuyển xứ"... sẽ tự động bị ẩn, không cần xóa tay trong Excel.

### 6.2. Cách import

1. Vào tab **Quản lý lớp**, ở đầu cột **Thêm lớp**, bấm **Import từ Excel (.xlsx)**.
2. Chọn file Excel từ máy tính.
3. Một bảng lớn hiện ra bên dưới, mỗi dòng là 1 giáo lý viên, gồm các cột:

   | Cột | Ý nghĩa |
   | --- | --- |
   | Ảnh | Ảnh đại diện — mặc định theo giới tính (hình bé trai/gái), bấm vào để đổi ảnh riêng, có nút nhỏ để quay lại ảnh mặc định. |
   | Tên Thánh / Họ Tên | Lấy từ file Excel, không sửa được ở đây. |
   | Lớp đang dạy | Có thể **gõ sửa trực tiếp** nếu file Excel để trống hoặc ghi sai. |
   | GLV | Chọn **GLV 1** (giáo lý viên chính) hoặc **GLV 2** (giáo lý viên phụ) — mặc định là GLV 1 vì đa số lớp chỉ có 1 người; chỉ đổi thành GLV 2 cho người thứ hai nếu lớp đó có 2 giáo lý viên dạy chung. |
   | Giới tính | Chọn **Nam** hoặc **Nữ** — ứng dụng tự đoán sẵn theo Tên Thánh (ví dụ "Giuse" → Nam, "Maria" → Nữ), nhưng vẫn cần **kiểm tra lại** vì chỉ là gợi ý, có thể sai với tên hiếm gặp. |

4. Nếu có người **không được phân công dạy năm nay**, bấm biểu tượng thùng rác ở cuối dòng người đó
   để xóa khỏi danh sách import (không ảnh hưởng dữ liệu gốc trong file Excel).
5. Điền đầy đủ **Lớp đang dạy**, **GLV**, **Giới tính** cho tất cả các dòng còn lại — nút
   **Tạo lớp từ danh sách** chỉ bật khi đã điền đủ.
6. Bấm **Tạo lớp từ danh sách**.

### 6.3. Sau khi bấm "Tạo lớp từ danh sách", điều gì xảy ra?

- Ứng dụng gom các dòng có **cùng tên Lớp đang dạy** lại thành 1 lớp. Nếu 2 người cùng ghi 1 lớp,
  người **GLV 1** thành giáo lý viên chính, người **GLV 2** thành giáo lý viên phụ.
- **Ngành** được tự suy ra từ tên lớp — ví dụ lớp "Chiên Con 1A" tự nhận ngành Chiên Con, "Nghĩa Sĩ
  2B" tự nhận ngành Nghĩa Sĩ... Vì vậy **tên lớp trong Excel nên chứa đúng tên ngành** để nhận diện
  chính xác.
- Nếu tên lớp đã tồn tại sẵn trong **Quản lý lớp** (ví dụ đã tạo tay từ trước), lớp đó sẽ được
  **cập nhật** thông tin thay vì tạo trùng lớp mới.
- Ảnh giáo lý viên dùng đúng ảnh đã chọn ở bảng import (ảnh mặc định theo giới tính, hoặc ảnh riêng
  nếu đã tải lên).

Sau khi tạo xong, vào tab **Quản lý lớp** để xem/sửa lại từng lớp nếu cần (thêm khẩu hiệu, đổi màu,
thêm ảnh riêng...).

---

## 7. Trình chiếu — cách "xé túi mù" trong đêm diễn ra

### 7.1. Mở trang trình chiếu

Vào đường link `https://ten-du-an.pages.dev/presenter` trên máy tính/TV kết nối máy chiếu.

Màn hình đầu tiên hiện logo, tên xứ đoàn và nút **Bắt đầu** — bấm vào để vào màn hình chọn túi mù
(bấm 1 lần trước để trình duyệt cho phép phát âm thanh).

### 7.2. Màn hình chọn túi mù

Đây là màn hình chính hiển thị **tất cả các túi mù** (mỗi túi là 1 lớp). Có thanh công cụ ở góc
trên, từ trái qua phải:

- **Chọn túi mù ngẫu nhiên** — bấm để máy tự xoay vòng chọn ngẫu nhiên 1 túi chưa mở (có hiệu ứng
  chạy đèn, dừng lại ở 1 túi).
- **Chỉ chọn túi chưa mở** — bật để random chỉ chọn trong các túi chưa mở (tắt nếu muốn cho phép
  chọn trúng túi đã mở rồi).
- **Cho phép mở lại** — bật nếu muốn có thể bấm lại vào 1 túi đã mở để xem lại animation.
- **Reset** — đưa toàn bộ túi về trạng thái "chưa mở" (dùng để tổng duyệt xong rồi làm lại buổi
  thật).
- Ô chọn **ngành** — lọc chỉ hiện túi mù của 1 ngành, tiện khi trình chiếu theo từng khối riêng.
- Các icon còn lại: hiện/ẩn tên lớp trên túi, bật/tắt âm thanh, chuyển đổi hiệu ứng chuyển động, và
  toàn màn hình.

**Cách mở 1 túi**: bấm trực tiếp vào túi mù muốn mở (hoặc để máy random chọn xong), túi sáng lên
được chọn thì hệ thống tự chuyển sang màn hình xé túi.

### 7.3. Màn hình xé túi (animation chính)

1. Màn hình hiện dòng chữ **"Các bạn đã sẵn sàng chưa?"** cùng hình túi mù lớn.
2. Bấm nút **▶ (Play)** ở thanh công cụ dưới cùng, hoặc bấm phím **Space** trên bàn phím, để bắt
   đầu.
3. Máy đếm ngược **3 → 2 → 1 → Xé!** (có tiếng túi giấy/nylon phát kèm), sau đó túi rung lắc rồi xé
   ra.
4. Poster của lớp (tên lớp, ảnh và tên giáo lý viên) hiện ra kèm hiệu ứng ánh sáng, pháo giấy
   (confetti) và tiếng reo vui.

**Các nút trên thanh công cụ dưới cùng khi đang ở màn hình xé túi:**

| Icon | Chức năng |
| --- | --- |
| 🏠 Nhà | Về lại màn hình chọn túi mù |
| 🔊 Loa | Bật/tắt âm thanh |
| ⤢ Phóng to | Bật/tắt toàn màn hình |
| ← Mũi tên trái | Quay lại màn hình chọn túi mù (giống nút Nhà) |
| ▶ Tam giác | Bắt đầu xé túi |
| ↺ Xoay tròn | Reset lại animation của túi này (xé lại từ đầu) |
| ⬇ Tải xuống | Tải ảnh Poster (.png) về máy — chỉ bật sau khi đã xé xong |

**Phím tắt bàn phím** (khi đang ở màn hình xé túi):

- `Space`: bắt đầu xé túi
- `R`: reset lại animation
- `Esc` hoặc `←`: quay lại màn hình chọn túi mù
- `F`: toàn màn hình
- `S`: bật/tắt âm thanh

### 7.4. Sau đêm trình chiếu

Vào đường link `https://ten-du-an.pages.dev/ket-qua` để xem/gửi cho mọi người danh sách lớp đã
công bố (trang này ai cũng xem được, không cần đăng nhập).

---

## 8. Xử lý sự cố thường gặp

**Cloudflare build xong nhưng deploy hỏng: `Authentication error [code: 10000]`**
→ Ô **Deploy command** đang chạy `wrangler pages deploy` trong khi project được tạo dưới dạng
**Worker** (nhận ra bằng đường dẫn `.../workers/services/view/...` trên thanh địa chỉ). Vào
**Workers & Pages → chọn project → Settings → Build**, sửa **Deploy command** thành
`npx wrangler deploy` rồi **Retry deployment**. Cấu hình còn lại đã nằm sẵn trong file
`wrangler.jsonc` của mã nguồn. Nếu project là Pages project thật (đường dẫn `.../pages/view/...`)
thì không cần deploy command, để trống là được.

**Vào trang quản trị báo "Không tải được dữ liệu từ Supabase"**
→ Kiểm tra lại 2 biến môi trường `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` trên Cloudflare
Pages (mục 3.3) đã điền đúng và không thừa khoảng trắng. Sau khi sửa, vào tab **Deployments** bấm
**Retry deployment**.

**Import Excel báo lỗi hoặc không đọc được file**
→ Kiểm tra file đúng định dạng `.xlsx` (không phải `.xls` cũ hoặc `.csv`), và có ít nhất các cột
Tên Thánh, Họ, Tên, Lớp đang dạy, Tình trạng.

**Ảnh tải lên bị lỗi/không hiện**
→ Kiểm tra dung lượng ảnh không quá 10 MB. Nếu vẫn lỗi, có thể bảng `organization_settings` hoặc
kho ảnh `class-photos` chưa được tạo — chạy lại đoạn SQL ở mục 2.2, an toàn để chạy nhiều lần.

**Bấm "Thêm lớp"/"Lưu thông tin" không có phản hồi**
→ Có thể đang mất kết nối mạng. Ứng dụng sẽ tự lưu tạm trên máy hiện tại (báo "chưa đồng bộ"), khi
có mạng lại bấm nút **Thử đồng bộ**.

**Muốn đổi lại toàn bộ trạng thái túi mù về "chưa mở" trước đêm thật**
→ Vào tab **Quản lý lớp** hoặc màn hình Presenter, bấm nút **Reset**.
