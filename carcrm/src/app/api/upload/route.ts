import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Утиліта для створення папок
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'hero', 'fleet', 'gallery'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    let relativeUrl = '';

    if (isVideo) {
      const videosDir = path.join(uploadsDir, 'videos');
      ensureDirExists(videosDir);
      
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(videosDir, fileName);
      
      fs.writeFileSync(filePath, buffer);
      relativeUrl = `/uploads/videos/${fileName}`;
    } else if (isImage) {
      const imagesDir = path.join(uploadsDir, 'images');
      ensureDirExists(imagesDir);
      
      const fileName = `${Date.now()}_optimized.webp`;
      const filePath = path.join(imagesDir, fileName);

      let sharpInstance = sharp(buffer);

      // Обрізка відповідно дизайну сайту
      if (type === 'hero') {
        sharpInstance = sharpInstance.resize(1920, 1080, { fit: 'cover' }); // Широкоформатний для фону
      } else if (type === 'fleet') {
        sharpInstance = sharpInstance.resize(800, 500, { fit: 'cover' }); // Для карток автопарку (16:10)
      } else if (type === 'gallery') {
        sharpInstance = sharpInstance.resize(1280, 853, { fit: 'cover' }); // Для великої галереї (3:2)
      } else {
        sharpInstance = sharpInstance.resize(1280, null, { withoutEnlargement: true }); // Дефолтне обмеження ширини
      }

      await sharpInstance
        .webp({ quality: 80 }) // Конвертація у WebP для SEO та швидкості
        .toFile(filePath);

      relativeUrl = `/uploads/images/${fileName}`;
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ url: relativeUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
