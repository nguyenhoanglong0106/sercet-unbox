import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const artifacts = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(artifacts, { recursive: true });

const classes = [{
  id: '11111111-1111-4111-8111-111111111111',
  class_name: 'Thiếu Nhi 1',
  division: 'THIEU_NHI',
  teacher_name: 'Maria Nguyễn Thị Minh Anh',
  teacher_image: '/assets/glv-nu.jpg',
  assistant_name: '',
  assistant_image: '',
  slogan: '',
  primary_color: '#3997d3',
  order_index: 1,
  revealed: true,
}];

const browser = await chromium.launch({ headless: true });
const pageErrors = [];

async function openContext(state) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = { 'access-control-allow-origin': '*' };
    if (url.pathname.endsWith('/classes')) {
      assert.equal(request.method(), 'GET', 'Tests must never write classes');
      await route.fulfill({ json: classes, headers });
      return;
    }
    assert.ok(url.pathname.endsWith('/organization_settings'), 'Unexpected API request');
    if (state.failure) {
      await route.fulfill({ status: 404, json: { code: 'PGRST205', message: 'Missing table' }, headers });
      return;
    }
    if (request.method() === 'POST') {
      state.writes = (state.writes || 0) + 1;
      state.row = request.postDataJSON();
      await route.fulfill({ json: state.row, headers });
    } else {
      await route.fulfill({ json: state.row ? [state.row] : [], headers });
    }
  });
  await context.route('**/storage/v1/**', async (route) => {
    if (route.request().method() === 'POST') {
      state.uploads = (state.uploads || 0) + 1;
      await route.fulfill({ json: { Key: 'class-photos/organization/test.png' } });
    } else {
      await route.fulfill({ path: fileURLToPath(new URL('../public/assets/logo-tntt.png', import.meta.url)) });
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/setup`);
  await page.waitForFunction(() => !document.querySelector('.organization-form fieldset')?.disabled);
  return { context, page };
}

async function save(page, expected) {
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await page.getByRole('status').filter({ hasText: expected }).waitFor();
}

async function assertLayout(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.evaluate(() => document.fonts.ready);
  const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(size.content <= size.width + 1, `${name}: horizontal overflow ${JSON.stringify(size)}`);
  const posters = await page.locator('.class-poster:visible').evaluateAll((elements) => elements.map((poster) => {
    const boundary = poster.getBoundingClientRect();
    const content = poster.querySelector('.poster-info-panel').getBoundingClientRect();
    return { bottom: boundary.bottom, contentBottom: content.bottom };
  }));
  for (const poster of posters) {
    assert.ok(poster.contentBottom <= poster.bottom + 1, `${name}: poster content is clipped ${JSON.stringify(poster)}`);
  }
  await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
}

try {
  const online = {};
  const { page, context } = await openContext(online);
  assert.equal(await page.locator('input[name="parishName"]').inputValue(), 'Giáo Xứ Bắc Thần');
  await page.locator('input[name="name"]').fill('   ');
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await page.getByText('Vui lòng điền thông tin này.', { exact: true }).waitFor();
  assert.equal(online.writes || 0, 0);

  const name = 'Xứ đoàn Thánh Đaminh Saviô';
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="parishName"]').fill('Giáo Xứ Tân Bình');
  await page.locator('input[name="diocese"]').fill('Giáo phận Sài Gòn');
  await page.locator('input[name="academicYear"]').fill('2027 - 2028');
  await page.locator('input[name="slogan"]').fill('Học Giáo Lý - Sống Đức Tin');
  assert.equal(await page.locator('.organization-preview .poster-header p').textContent(), name);
  assert.equal(await page.locator('.setup-brand span').textContent(), 'Giáo Xứ Bắc Thần', 'Draft must not change saved branding');

  await page.locator('input[name="logoUrl"]').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await page.getByText('Vui lòng nhập đường dẫn ảnh HTTPS hợp lệ.').waitFor();
  await page.getByRole('button', { name: 'Khôi phục logo xứ đoàn mặc định', exact: true }).click();
  await page.getByLabel('Tải logo xứ đoàn', { exact: true }).setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await page.getByText('Định dạng ảnh chưa được hỗ trợ.').waitFor();
  assert.equal(online.uploads || 0, 0);
  await page.getByLabel('Tải logo xứ đoàn', { exact: true }).setInputFiles(fileURLToPath(new URL('../public/assets/logo-tntt.png', import.meta.url)));
  await page.waitForFunction(() => document.querySelector('input[name="logoUrl"]').value.startsWith('https://'));
  assert.equal(online.uploads, 1);

  await page.getByRole('button', { name: 'Quản lý lớp', exact: true }).click();
  await page.getByRole('heading', { name: 'Danh sách lớp', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thông tin xứ đoàn', exact: true }).click();
  assert.equal(await page.locator('input[name="name"]').inputValue(), name);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: 'Trang kết quả', exact: true }).click();
  assert.ok(page.url().endsWith('/setup'), 'Unsaved changes must remain after canceling navigation');

  await save(page, 'Đã lưu và đồng bộ thông tin xứ đoàn.');
  assert.equal(online.row.name, name);
  assert.equal(online.row.academic_year, '2027 - 2028');
  assert.equal(await page.locator('.setup-brand span').textContent(), 'Giáo Xứ Tân Bình');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('giao-ly-organization')).pending), false);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('.organization-form fieldset')?.disabled);
  assert.equal(await page.locator('input[name="name"]').inputValue(), name);

  await assertLayout(page, 'organization-desktop', { width: 1440, height: 1000 });
  await assertLayout(page, 'organization-mobile', { width: 390, height: 844 });
  await assertLayout(page, 'organization-small-mobile', { width: 320, height: 740 });
  await assertLayout(page, 'organization-tablet', { width: 820, height: 1180 });
  await page.locator('input[name="name"]').fill('TênXứĐoàn'.repeat(13).slice(0, 120));
  await page.locator('input[name="parishName"]').fill('Giáo xứ có tên dài để kiểm tra bố cục thông tin hiển thị trên poster');
  await page.locator('input[name="slogan"]').fill('KhẩuHiệuXứĐoàn'.repeat(11).slice(0, 160));
  await assertLayout(page, 'organization-long-names', { width: 390, height: 844 });
  await page.getByRole('button', { name: 'Hủy thay đổi', exact: true }).click();

  await page.locator('.organization-preview').getByRole('button', { name: 'Túi', exact: true }).click();
  assert.equal(await page.locator('.organization-preview .bag-year').innerText(), 'Giáo Lý 2027 - 2028');
  await page.getByRole('link', { name: 'Trang kết quả', exact: true }).click();
  await page.getByRole('heading', { name: 'Danh Sách Lớp Giáo Lý 2027 - 2028' }).waitFor();
  assert.equal(await page.locator('.poster-header p').textContent(), name);
  await assertLayout(page, 'results-mobile', { width: 390, height: 844 });
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(async () => {
    const { downloadPoster } = await import('/src/services/exportService.js');
    await downloadPoster(document.querySelector('.class-poster'), { className: 'Test', teacherName: 'GLV' });
  });
  const download = await downloadPromise;
  assert.equal(await download.failure(), null, 'Poster download must succeed');
  await download.saveAs(`${artifacts}/organization-poster.png`);
  await page.goto(`${baseUrl}/presenter`);
  await page.getByText(name, { exact: true }).waitFor();
  await page.getByText('Giáo phận Sài Gòn', { exact: true }).waitFor();
  await assertLayout(page, 'presenter-mobile', { width: 390, height: 844 });
  await assertLayout(page, 'presenter-landscape', { width: 844, height: 390 });
  const intro = await page.locator('.intro-logo').boundingBox();
  assert.ok(intro.y >= 0, 'Presenter logo must be reachable at the top of the page');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await page.locator('.presenter-board').waitFor();
  await context.close();
  console.log('PASS: validation, upload, preview, draft protection, online save/reload, branding and responsive layouts');

  const offline = { failure: true, row: online.row };
  const local = await openContext(offline);
  await local.page.locator('input[name="name"]').fill('Xứ đoàn lưu trên thiết bị');
  await save(local.page, 'Đã lưu thông tin trên thiết bị này.');
  assert.equal(await local.page.evaluate(() => JSON.parse(localStorage.getItem('giao-ly-organization')).pending), true);
  offline.failure = false;
  await local.page.reload();
  await local.page.waitForFunction(() => !document.querySelector('.organization-form fieldset')?.disabled);
  assert.equal(await local.page.locator('input[name="name"]').inputValue(), 'Xứ đoàn lưu trên thiết bị', 'Server must not replace unsynced local changes');
  await local.page.getByRole('button', { name: 'Thử đồng bộ', exact: true }).click();
  await local.page.getByText('Đã lưu và đồng bộ thông tin xứ đoàn.', { exact: true }).waitFor();
  assert.equal(offline.row.name, 'Xứ đoàn lưu trên thiết bị');
  assert.equal(await local.page.evaluate(() => JSON.parse(localStorage.getItem('giao-ly-organization')).pending), false);
  await local.context.close();
  console.log('PASS: local fallback, pending changes across reload and explicit cloud synchronization');

  const secondDevice = await openContext(offline);
  assert.equal(await secondDevice.page.locator('input[name="name"]').inputValue(), 'Xứ đoàn lưu trên thiết bị', 'A fresh browser must receive the synced server profile');
  await secondDevice.context.close();
  console.log('PASS: synchronized profile loads in a fresh browser');

  const broken = await openContext({ failure: true });
  await broken.page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await broken.page.locator('input[name="name"]').fill('Không thể lưu');
  await broken.page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await broken.page.getByRole('alert').filter({ hasText: 'Chưa lưu được thông tin' }).waitFor();
  assert.equal(await broken.page.locator('input[name="name"]').inputValue(), 'Không thể lưu');
  assert.equal(await broken.page.locator('.setup-brand span').textContent(), 'Giáo Xứ Bắc Thần');
  await broken.context.close();
  console.log('PASS: failed cloud and local writes keep unsaved draft and show an error');
  assert.deepEqual(pageErrors, [], 'Unexpected browser errors');
} finally {
  await browser.close();
}
