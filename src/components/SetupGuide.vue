<template>
  <section class="guide">
    <p class="guide-intro">
      Tài liệu này dành cho người <strong>chưa từng dùng công cụ lập trình</strong>. Làm theo đúng
      thứ tự từng bước, không cần hiểu sâu — chỉ cần làm 1 lần, những năm sau chỉ cần vào
      <strong>Quản lý lớp</strong> để cập nhật danh sách mới.
    </p>

    <nav class="guide-toc" aria-label="Mục lục">
      <a v-for="item in toc" :key="item.id" :href="`#${item.id}`">{{ item.label }}</a>
    </nav>

    <article id="guide-accounts" class="guide-section">
      <h3>1. Chuẩn bị tài khoản</h3>
      <p>Cần 2 tài khoản, đều <strong>miễn phí</strong>:</p>
      <ul>
        <li>
          <strong>Supabase</strong> (kho lưu dữ liệu) — vào
          <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>, bấm
          <em>Start your project</em>, đăng nhập bằng Google hoặc GitHub.
        </li>
        <li>
          <strong>Cloudflare</strong> (nơi lưu trang web) — vào
          <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener">dash.cloudflare.com/sign-up</a>,
          đăng ký bằng email.
        </li>
      </ul>
    </article>

    <article id="guide-supabase" class="guide-section">
      <h3>2. Tạo "kho dữ liệu" trên Supabase</h3>

      <h4>2.1. Tạo project mới</h4>
      <ol>
        <li>Đăng nhập <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">supabase.com/dashboard</a>.</li>
        <li>Bấm <strong>New project</strong>.</li>
        <li>
          Điền <strong>Name</strong> (đặt tên tùy ý), <strong>Database Password</strong> (bấm
          <em>Generate a password</em> rồi lưu lại chỗ an toàn), <strong>Region</strong> chọn
          <em>Southeast Asia (Singapore)</em> cho gần Việt Nam.
        </li>
        <li>Bấm <strong>Create new project</strong>, đợi 1–2 phút cho Supabase khởi tạo xong.</li>
      </ol>

      <h4>2.2. Tạo bảng dữ liệu</h4>
      <ol>
        <li>Ở menu bên trái Supabase, bấm <strong>SQL Editor</strong> (biểu tượng <code>&lt;/&gt;</code>).</li>
        <li>Bấm <strong>New query</strong>.</li>
        <li>Bấm nút <strong>Copy đoạn lệnh SQL</strong> bên dưới, rồi dán (Ctrl+V) vào ô soạn thảo vừa mở.</li>
        <li>Bấm <strong>Run</strong> (hoặc Ctrl+Enter). Thấy dòng <em>Success. No rows returned</em> màu xanh là xong.</li>
      </ol>

      <div class="guide-sql-box">
        <div class="guide-sql-toolbar">
          <span>Nội dung file <code>supabase/schema.sql</code></span>
          <button class="text-button text-button--primary" type="button" @click="copySql">
            <component :is="copied ? Check : Copy" :size="16" />
            {{ copied ? 'Đã copy!' : 'Copy đoạn lệnh SQL' }}
          </button>
        </div>
        <pre class="guide-sql-pre"><code>{{ schemaSql }}</code></pre>
      </div>

      <p class="guide-note">
        An toàn để chạy lại nhiều lần — không xóa mất dữ liệu đã có. Đoạn lệnh tạo bảng
        <code>classes</code> (danh sách lớp), bảng <code>organization_settings</code> (thông tin
        xứ đoàn) và kho ảnh <code>class-photos</code>.
      </p>

      <h4>2.3. Lấy 2 mã kết nối</h4>
      <ol>
        <li>Bấm biểu tượng bánh răng <strong>Project Settings</strong> ở menu bên trái.</li>
        <li>Chọn mục <strong>Data API</strong> (hoặc <strong>API</strong>).</li>
        <li>
          Sao chép và lưu lại: <strong>Project URL</strong> (dạng
          <code>https://xxxx.supabase.co</code>) và <strong>anon public</strong> key trong mục
          <em>Project API keys</em> (chuỗi dài bắt đầu bằng <code>eyJ...</code>).
        </li>
      </ol>
      <p class="guide-note guide-note--warning">Không chia sẻ 2 giá trị này cho người lạ.</p>
    </article>

    <article id="guide-cloudflare" class="guide-section">
      <h3>3. Đưa ứng dụng lên Cloudflare Pages</h3>

      <h4>3.1. Tạo trang trên Cloudflare</h4>
      <ol>
        <li>Đăng nhập <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">dash.cloudflare.com</a>.</li>
        <li>Menu bên trái → <strong>Workers &amp; Pages</strong> → <strong>Create application</strong> → tab <strong>Pages</strong> → <strong>Connect to Git</strong>.</li>
        <li>Chọn repository GitHub chứa mã nguồn ứng dụng → <strong>Begin setup</strong>.</li>
        <li>
          Điền <strong>Build settings</strong>: Framework preset <code>Vite</code> (hoặc
          <code>None</code> nếu không có), Build command <code>npm run build</code>, Build output
          directory <code>dist</code>.
        </li>
      </ol>

      <h4>3.2. Gắn biến môi trường (Environment variables)</h4>
      <p>
        Trước khi bấm <em>Save and Deploy</em>, mở rộng mục
        <strong>Environment variables (advanced)</strong>, bấm <strong>Add variable</strong> 2 lần:
      </p>
      <table class="glv-table guide-table">
        <thead>
          <tr><th>Variable name</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td><code>VITE_SUPABASE_URL</code></td><td>Project URL đã lấy ở mục 2.3</td></tr>
          <tr><td><code>VITE_SUPABASE_ANON_KEY</code></td><td>anon public key đã lấy ở mục 2.3</td></tr>
        </tbody>
      </table>
      <p>
        Bấm <strong>Save and Deploy</strong>. Đợi 1–3 phút, Cloudflare cấp một đường link dạng
        <code>https://ten-du-an.pages.dev</code> — đây là trang web chính thức để dùng.
      </p>
      <p class="guide-note">
        Muốn đổi mã kết nối sau này: <strong>Workers &amp; Pages → chọn project → Settings →
        Environment variables</strong>, sửa xong vào tab <strong>Deployments</strong> bấm
        <strong>Retry deployment</strong>.
      </p>
    </article>

    <article id="guide-org" class="guide-section">
      <h3>4. Thiết lập thông tin xứ đoàn</h3>
      <p>
        Vào <code>/setup</code> → tab <strong>Thông tin xứ đoàn</strong>. Điền Tên xứ đoàn, Giáo
        xứ, Giáo phận (không bắt buộc), Niên khóa, Khẩu hiệu xứ đoàn. Ở mục <strong>Hình ảnh</strong>,
        mỗi ảnh (Logo / Ảnh nền trình chiếu / Ảnh nhà thờ) có thể <strong>Tải ảnh lên</strong> (tối
        đa 10&nbsp;MB) hoặc dán link ảnh, và bấm nút xoay tròn để khôi phục ảnh mặc định. Khung
        <strong>Xem trước</strong> bên phải cập nhật ngay khi gõ. Bấm <strong>Lưu thông tin</strong>
        để áp dụng cho toàn bộ ứng dụng.
      </p>
      <p class="guide-note">
        Mất mạng khi lưu: ứng dụng tự lưu tạm trên máy và báo "chưa đồng bộ" — có mạng lại bấm
        <strong>Thử đồng bộ</strong>.
      </p>
    </article>

    <article id="guide-classes" class="guide-section">
      <h3>5. Quản lý lớp — tạo lớp thủ công</h3>
      <p>
        Tab <strong>Quản lý lớp</strong>, cột <strong>Thêm lớp</strong>: Tên lớp, Khối/Ngành (ảnh
        minh họa Poster tự đổi theo ngành), Giáo lý viên chính/phụ (gõ đầy đủ Tên Thánh + Họ Tên,
        để trống ô phụ nếu chỉ có 1 người), Câu khẩu hiệu riêng, Màu chủ đạo, và ảnh GLV — bấm vào
        ô để chọn ảnh, ảnh hiện luôn trong ô kèm dấu ✓ xanh, bấm dấu X đỏ để xóa ảnh về icon mặc
        định. Bấm <strong>Thêm lớp</strong> để lưu; sửa/xóa lớp đã có bằng icon bút chì/thùng rác
        trên từng lớp.
      </p>
    </article>

    <article id="guide-import" class="guide-section">
      <h3>6. Import danh sách Giáo Lý Viên từ Excel</h3>
      <p>
        File Excel cần các cột: <strong>Tên Thánh</strong>, <strong>Họ</strong>, <strong>Tên</strong>,
        <strong>Lớp đang dạy</strong>, <strong>Tình trạng</strong>. Chỉ những người có Tình trạng
        đúng "<strong>Bình thường</strong>" mới được lấy vào — người ghi Nghỉ luôn/Tạm nghỉ/Chuyển
        xứ tự động bị ẩn.
      </p>
      <ol>
        <li>Tab <strong>Quản lý lớp</strong>, đầu cột Thêm lớp, bấm <strong>Import từ Excel (.xlsx)</strong> và chọn file.</li>
        <li>
          Bảng hiện ra từng dòng 1 người: <strong>Ảnh</strong> (mặc định theo giới tính, bấm để đổi
          ảnh riêng), <strong>Lớp đang dạy</strong> (gõ sửa được nếu Excel để trống),
          <strong>GLV</strong> (chọn GLV&nbsp;1 = giáo lý viên chính, GLV&nbsp;2 = phụ — mặc định
          GLV&nbsp;1 vì đa số lớp chỉ có 1 người), <strong>Giới tính</strong> (Nam/Nữ, tự đoán theo
          Tên Thánh nhưng vẫn cần kiểm tra lại vì chỉ là gợi ý).
        </li>
        <li>Bấm thùng rác ở cuối dòng để xóa người không được phân công dạy năm nay.</li>
        <li>Điền đủ Lớp đang dạy/GLV/Giới tính cho mọi dòng — nút <strong>Tạo lớp từ danh sách</strong> mới bật.</li>
        <li>Bấm <strong>Tạo lớp từ danh sách</strong>.</li>
      </ol>
      <p>
        Ứng dụng gom theo <strong>cùng tên Lớp đang dạy</strong>: 2 người chung lớp thì GLV&nbsp;1
        thành chính, GLV&nbsp;2 thành phụ. <strong>Ngành tự suy ra từ tên lớp</strong> (vd "Chiên
        Con 1A" → Chiên Con) — nên tên lớp trong Excel cần chứa đúng tên ngành. Lớp trùng tên lớp
        đã có sẽ được cập nhật thay vì tạo trùng.
      </p>
    </article>

    <article id="guide-presenter" class="guide-section">
      <h3>7. Trình chiếu — cách "xé túi mù" trong đêm diễn ra</h3>
      <p>
        Vào <code>/presenter</code> trên máy/TV trình chiếu, bấm <strong>Bắt đầu</strong> (bấm 1
        lần để trình duyệt cho phép phát âm thanh).
      </p>
      <p>
        Màn hình chọn túi mù có thanh công cụ: <strong>Chọn túi mù ngẫu nhiên</strong>,
        <strong>Chỉ chọn túi chưa mở</strong>, <strong>Cho phép mở lại</strong>, <strong>Reset</strong>
        (đưa tất cả về chưa mở), ô lọc theo <strong>ngành</strong>, và các nút hiện/ẩn tên lớp, âm
        thanh, hiệu ứng chuyển động, toàn màn hình. Bấm trực tiếp vào 1 túi (hoặc để random chọn) để
        mở.
      </p>
      <p>
        Ở màn hình xé túi: bấm nút <strong>▶</strong> hoặc phím <kbd>Space</kbd> để đếm ngược
        3-2-1 rồi túi tự xé ra, Poster hiện kèm pháo giấy và âm thanh reo vui.
      </p>
      <table class="glv-table guide-table">
        <thead><tr><th>Phím tắt</th><th>Chức năng</th></tr></thead>
        <tbody>
          <tr><td><kbd>Space</kbd></td><td>Bắt đầu xé túi</td></tr>
          <tr><td><kbd>R</kbd></td><td>Reset lại animation</td></tr>
          <tr><td><kbd>Esc</kbd> / <kbd>←</kbd></td><td>Quay lại màn hình chọn túi mù</td></tr>
          <tr><td><kbd>F</kbd></td><td>Toàn màn hình</td></tr>
          <tr><td><kbd>S</kbd></td><td>Bật/tắt âm thanh</td></tr>
        </tbody>
      </table>
      <p>
        Sau đêm trình chiếu, vào <code>/ket-qua</code> để xem hoặc gửi cho mọi người danh sách lớp
        đã công bố (không cần đăng nhập).
      </p>
    </article>

    <article id="guide-faq" class="guide-section">
      <h3>8. Xử lý sự cố thường gặp</h3>
      <dl class="guide-faq">
        <dt>Trang quản trị báo "Không tải được dữ liệu từ Supabase"</dt>
        <dd>Kiểm tra lại 2 biến môi trường trên Cloudflare Pages (mục 3.2) rồi <strong>Retry deployment</strong>.</dd>
        <dt>Import Excel báo lỗi hoặc không đọc được file</dt>
        <dd>File phải đúng định dạng <code>.xlsx</code> (không phải <code>.xls</code>/<code>.csv</code>) và có đủ các cột cần thiết.</dd>
        <dt>Ảnh tải lên bị lỗi/không hiện</dt>
        <dd>Kiểm tra ảnh không quá 10&nbsp;MB. Nếu vẫn lỗi, chạy lại đoạn SQL ở mục 2.2 (an toàn khi chạy nhiều lần).</dd>
        <dt>Bấm Lưu/Thêm lớp không có phản hồi</dt>
        <dd>Có thể đang mất mạng — dữ liệu tự lưu tạm trên máy, có mạng lại bấm <strong>Thử đồng bộ</strong>.</dd>
      </dl>
    </article>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { Check, Copy } from 'lucide-vue-next';
import schemaSql from '../../supabase/schema.sql?raw';

const toc = [
  { id: 'guide-accounts', label: '1. Chuẩn bị tài khoản' },
  { id: 'guide-supabase', label: '2. Tạo kho dữ liệu Supabase' },
  { id: 'guide-cloudflare', label: '3. Đưa lên Cloudflare Pages' },
  { id: 'guide-org', label: '4. Thông tin xứ đoàn' },
  { id: 'guide-classes', label: '5. Quản lý lớp' },
  { id: 'guide-import', label: '6. Import Excel' },
  { id: 'guide-presenter', label: '7. Trình chiếu' },
  { id: 'guide-faq', label: '8. Xử lý sự cố' },
];

const copied = ref(false);

async function copySql() {
  try {
    await navigator.clipboard.writeText(schemaSql);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = schemaSql;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>
