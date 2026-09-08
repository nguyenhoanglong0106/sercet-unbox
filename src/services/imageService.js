import * as UTIF from 'utif';
import { CLASS_PHOTOS_BUCKET, supabase } from '@/services/supabaseClient';

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const TIFF_EXTENSIONS = ['.tif', '.tiff'];

function getExtension(fileName = '') {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function isTiff(file) {
  const extension = getExtension(file.name);
  return file.type === 'image/tiff' || TIFF_EXTENSIONS.includes(extension);
}

export function isSupportedImage(file) {
  return IMAGE_TYPES.has(file.type) || isTiff(file);
}

async function tiffToPngCanvas(file) {
  const buffer = await readAsArrayBuffer(file);
  const ifds = UTIF.decode(buffer);
  const firstImage = ifds[0];

  if (!firstImage) {
    throw new Error('Không đọc được file TIFF.');
  }

  UTIF.decodeImage(buffer, firstImage);
  const rgba = UTIF.toRGBA8(firstImage);
  const canvas = document.createElement('canvas');
  canvas.width = firstImage.width;
  canvas.height = firstImage.height;

  const context = canvas.getContext('2d');
  const imageData = context.createImageData(firstImage.width, firstImage.height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);

  return canvas;
}

export async function imageFileToDataUrl(file) {
  if (!file || !isSupportedImage(file)) {
    throw new Error('Định dạng ảnh chưa được hỗ trợ.');
  }

  if (!isTiff(file)) {
    return readAsDataUrl(file);
  }

  const canvas = await tiffToPngCanvas(file);
  return canvas.toDataURL('image/png');
}

async function toUploadableBlob(file) {
  if (!isTiff(file)) {
    return { blob: file, extension: getExtension(file.name).replace('.', '') || 'jpg', contentType: file.type };
  }

  const canvas = await tiffToPngCanvas(file);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { blob, extension: 'png', contentType: 'image/png' };
}

export async function uploadClassImage(file, folder = 'misc') {
  if (!file || !isSupportedImage(file)) {
    throw new Error('Định dạng ảnh chưa được hỗ trợ.');
  }

  const { blob, extension, contentType } = await toUploadableBlob(file);
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(CLASS_PHOTOS_BUCKET).upload(path, blob, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Tải ảnh lên thất bại: ${error.message}`);
  }

  const { data } = supabase.storage.from(CLASS_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
