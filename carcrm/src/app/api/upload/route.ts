import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import sharp from 'sharp';

type ImagePreset = {
  folder: string;
  width: number;
  height?: number;
  fit: 'cover' | 'inside';
  quality: number;
};

const IMAGE_MAX_SIZE = 24 * 1024 * 1024;
const VIDEO_MAX_SIZE = 250 * 1024 * 1024;

const imagePresets: Record<string, ImagePreset> = {
  hero: { folder: 'hero', width: 1920, height: 1080, fit: 'cover', quality: 84 },
  fleet: { folder: 'fleet', width: 1600, height: 1000, fit: 'cover', quality: 84 },
  gallery: { folder: 'gallery', width: 1800, height: 1200, fit: 'cover', quality: 84 },
  'social-square': { folder: 'social', width: 1080, height: 1080, fit: 'cover', quality: 86 },
  'social-story': { folder: 'social', width: 1080, height: 1920, fit: 'cover', quality: 86 },
  'social-landscape': { folder: 'social', width: 1200, height: 630, fit: 'cover', quality: 86 },
  default: { folder: 'images', width: 1600, fit: 'inside', quality: 84 },
};

function safeExtension(fileName: string, fallback: string) {
  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || fallback;
}

async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const presetKey = String(formData.get('preset') || formData.get('type') || 'default');
    const preset = imagePresets[presetKey] || imagePresets.default;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (isImage && file.size > IMAGE_MAX_SIZE) {
      return NextResponse.json({ error: 'Фото занадто велике. Максимум 24 MB.' }, { status: 400 });
    }

    if (isVideo && file.size > VIDEO_MAX_SIZE) {
      return NextResponse.json({ error: 'Відео занадто велике. Максимум 250 MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (isImage) {
      const dir = path.join(uploadsDir, preset.folder);
      await ensureDir(dir);

      const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
      const filePath = path.join(dir, fileName);

      const image = sharp(buffer, { failOn: 'none' }).rotate();
      const resized = image.resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit,
        withoutEnlargement: preset.fit === 'inside',
        position: 'centre',
      });

      const output = await resized
        .webp({ quality: preset.quality, effort: 5 })
        .toBuffer({ resolveWithObject: true });

      await writeFile(filePath, output.data);

      return NextResponse.json({
        url: `/uploads/${preset.folder}/${fileName}`,
        type: 'IMAGE',
        originalName: file.name,
        width: output.info.width,
        height: output.info.height,
        size: output.info.size,
        preset: presetKey,
      });
    }

    if (isVideo) {
      const dir = path.join(uploadsDir, 'videos');
      await ensureDir(dir);

      const ext = safeExtension(file.name, 'mp4');
      const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
      const filePath = path.join(dir, fileName);

      await writeFile(filePath, buffer);

      return NextResponse.json({
        url: `/uploads/videos/${fileName}`,
        type: 'VIDEO',
        originalName: file.name,
        size: file.size,
        preset: 'video-original',
        note: 'Відео збережено без перекодування. Для серверної оптимізації потрібен ffmpeg у контейнері.',
      });
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
