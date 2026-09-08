import { toPng } from 'html-to-image';

export async function downloadPoster(node, classItem) {
  if (!node) {
    throw new Error('Poster chưa sẵn sàng.');
  }

  const pixelRatio = Math.max(2, Math.ceil(2048 / Math.max(node.offsetWidth, 1)));
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  downloadBlob(blob, `${posterFileName(classItem)}.png`);
}

export function posterFileName(classItem) {
  const name = [
    'Lop',
    classItem.className,
    classItem.teacherName || 'Giao-Ly-Vien',
  ]
    .join('-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return name || 'poster-giao-ly';
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
