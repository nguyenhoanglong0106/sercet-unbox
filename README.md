# Xé Túi Mù - Khám Phá Lớp Giáo Lý

Ứng dụng Vue 3/Vite để trình chiếu buổi nhận lớp Giáo Lý 2026 - 2027. Dữ liệu lớp và ảnh giáo lý viên được lưu online trên Supabase (Database + Storage) để dùng lại nhiều năm và để người khác xem lại kết quả qua trang `/ket-qua`.

## 1. Cài Node.js

Cài Node.js bản LTS mới. Kiểm tra:

```bash
node -v
npm -v
```

Trên Windows PowerShell nếu `npm` bị chặn execution policy, dùng:

```bash
npm.cmd -v
```

## 2. Cài dependencies

```bash
npm install
```

## 2b. Cấu hình Supabase

Tạo project tại supabase.com, sau đó:

1. Vào SQL Editor > New query, dán toàn bộ nội dung file `supabase/schema.sql` và bấm Run. Script này tạo bảng `classes`, bật quyền đọc/ghi công khai (app không có đăng nhập), và tạo Storage bucket `class-photos` để lưu ảnh.
2. Copy `.env.example` thành `.env`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (lấy trong Project Settings > API).

An toàn để chạy lại `schema.sql` nhiều lần nếu cần.

Nếu project đã có bảng lớp và Storage, chỉ cần chạy `supabase/organization-settings.sql` trong SQL Editor
để bổ sung bảng `organization_settings`. Bảng này dùng quyền đọc/ghi công khai giống bảng lớp hiện tại.

## 3. Chạy dev

```bash
npm run dev
```

Mở URL Vite hiển thị, thường là `http://localhost:5173`.

## 4. Build

```bash
npm run build
```

Output nằm trong thư mục `dist`.

Kiểm thử chức năng thông tin xứ đoàn bằng Playwright (giữ dev server đang chạy):

```bash
npm run test:organization
```

Test giả lập API, không sửa dữ liệu Supabase thật; ảnh chụp giao diện nằm trong `test-results/`.
Nếu dev server chạy cổng khác, đặt biến môi trường `TEST_BASE_URL` theo URL tương ứng.

## 5. Deploy Cloudflare Pages

Trong Cloudflare Dashboard:

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vue hoặc Vite

File `public/_redirects` đã có:

```txt
/* /index.html 200
```

Nhờ vậy các route SPA như `/presenter`, `/setup`, `/reveal/:id` hoạt động khi refresh trang.

## 6. Cách thêm hình ảnh

Asset chung nằm trong `public/assets/`:

- `background.png`: background trình chiếu chính
- `church-bac-than.png`: ảnh nhà thờ, dùng làm nền dự phòng khi thiếu ảnh minh họa ngành
- `logo-tntt.png`: logo TNTT/Giáo xứ
- `chien-con.jpg`, `au-nhi.jpg`, `thieu-nhi.jpg`, `nghia-si.jpg`, `hiep-si.jpg`: ảnh minh họa riêng theo từng
  ngành, hiển thị làm nền Poster (khai báo đường dẫn trong `src/data/divisions.js`)
- `glv-nam.jpg`, `glv-nu.jpg`: ảnh mặc định cho giáo lý viên nam/nữ khi chưa upload ảnh riêng (dùng trong chức
  năng import Excel ở mục 11)

Nếu thiếu ảnh minh họa ngành, poster tự dùng ảnh nhà thờ làm nền dự phòng, app không crash.

Ảnh gốc thường rất nặng (file TIFF/PNG in ấn nhiều MB) — nên convert sang `.jpg` chất lượng ~85, resize chiều
rộng khoảng 1400px trước khi bỏ vào `public/assets/` để trang tải nhanh.

## 7. Thiết lập xứ đoàn và tạo lớp

Vào `/setup` > **Thông tin xứ đoàn** để chỉnh tên xứ đoàn, giáo xứ, giáo phận, niên khóa, khẩu hiệu,
logo, ảnh nền trình chiếu và ảnh nhà thờ dự phòng. Có thể tải ảnh PNG/JPG/WebP/TIFF tối đa 10 MB hoặc
nhập đường dẫn HTTPS. Nút khôi phục cạnh từng ảnh đưa ảnh đó về mặc định; bấm **Lưu thông tin** để áp dụng.

Poster và túi được xem trước ngay khi nhập. Sau khi lưu, thông tin được dùng chung cho Presenter,
trang kết quả và poster tải xuống. Khẩu hiệu riêng của lớp được ưu tiên hơn khẩu hiệu xứ đoàn;
ảnh nhà thờ được dùng khi thiếu ảnh minh họa ngành.

Nếu chưa có bảng cấu hình hoặc mất kết nối, thông tin được lưu trong trình duyệt hiện tại và có
thông báo chưa đồng bộ. Khi máy chủ sẵn sàng, bấm **Thử đồng bộ**. Bản chưa đồng bộ được giữ lại khi
tải lại trang, không bị dữ liệu cũ trên máy chủ ghi đè. Thiết bị khác chỉ thấy thông tin đã đồng bộ.
Đổi tab vẫn giữ phần đang nhập; rời trang sẽ hỏi xác nhận nếu có thay đổi chưa lưu.

Vào `/setup` > **Quản lý lớp**, nhập:

- Tên lớp
- Ngành
- Giáo lý viên chính/phụ
- Hình giáo lý viên
- Hình đại diện lớp
- Khẩu hiệu
- Màu chủ đạo
- Ghi chú

Bấm `Thêm lớp` hoặc `Lưu lớp`. Danh sách lớp hiển thị dạng lưới, có thể lọc theo ngành, sửa, xóa và kéo thả để đổi thứ tự.

## 8. Presenter

Vào `/presenter`, bấm `Bắt đầu`, sau đó chọn túi mù hoặc dùng `Chọn túi mù ngẫu nhiên`. Có combobox lọc theo ngành để chỉ hiện các lớp/túi mù trong ngành đó. Có thể bật/tắt tên lớp, âm thanh, reduce motion, fullscreen và reset trạng thái mở túi.

## 8b. Trang kết quả (public, không cần đăng nhập)

Vào `/ket-qua` để xem danh sách lớp đã công bố (dùng để gửi link cho người khác xem lại sau buổi trình chiếu).

## 9. Keyboard shortcuts

Trong màn hình reveal:

- `Space`: bắt đầu xé túi
- `R`: reset animation
- `Esc`: quay lại presenter
- `F`: fullscreen
- `S`: bật/tắt sound
- `Arrow Right`: lớp tiếp theo
- `Arrow Left`: lớp trước

## 10. Fullscreen

Bấm nút fullscreen ở `/presenter` hoặc `/reveal`. Trong reveal, thanh điều khiển tự ẩn khi đang fullscreen và hiện lại khi di chuột.

## 11. Import danh sách Giáo Lý Viên và tự động tạo lớp

Trong `/setup`, ở đầu card "Thêm lớp", bấm `Import từ Excel (.xlsx)` và chọn file danh sách GLV (theo mẫu cột
`Tên Thánh`, `Họ`, `Tên`, `Lớp đang dạy`, `Tình trạng`...). App tự lọc, chỉ giữ lại những người có cột
`Tình trạng` là "Bình thường" (ẩn Nghỉ luôn / Tạm nghỉ / Chuyển xứ...).

Bảng import hiện full-width bên dưới, với các cột:

- `Ảnh`: mặc định theo giới tính (`public/assets/glv-nam.jpg` / `glv-nu.jpg`), bấm vào để tải ảnh riêng, có nút
  nhỏ để quay lại dùng ảnh mặc định.
- `Lớp đang dạy`: có thể sửa trực tiếp nếu file Excel để trống.
- `GLV`: GLV 1 hoặc GLV 2 — mặc định GLV 1 (đa số lớp chỉ có 1 người); nếu 2 người đã cùng ghi sẵn 1 lớp thì
  người thứ 2 tự động gợi ý GLV 2.
- `Giới tính`: tự gợi ý theo Tên Thánh (danh sách tên thánh phổ biến trong `src/data/saintGenders.js`), chỉ là
  gợi ý nên vẫn cần kiểm tra lại.
- Nút xóa dòng cho những ai không được phân công dạy năm nay.

Phải điền đủ Lớp đang dạy, GLV, Giới tính cho mọi dòng thì nút `Tạo lớp từ danh sách` mới bật. Khi bấm, app gom
theo `Lớp đang dạy`: 2 người cùng lớp (GLV1 + GLV2) được gộp vào 1 lớp (chính + phụ); ngành được suy ra từ tên
lớp (vd "Chiên Con 1A" → Chiên Con). Lớp trùng tên với lớp đã có sẽ được cập nhật thay vì tạo trùng.

Toàn bộ xử lý diễn ra ngay trong trình duyệt, không upload file lên server (ảnh giáo lý viên thì có upload lên
Supabase Storage khi được chọn).

## 12. Cách đổi theme

Màu theo ngành nằm trong `src/data/divisions.js`. Có thể đổi các giá trị:

- `color`
- `soft`
- `accent`
- `deep`
- `asset`

Mỗi lớp cũng có `primaryColor` riêng trong màn `/setup`.
