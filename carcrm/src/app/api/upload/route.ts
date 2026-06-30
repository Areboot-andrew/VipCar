import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    if (isVideo) {
      const ext = path.extname(file.name) || '.mp4';
      const filename = `vid-${uniqueSuffix}${ext}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'videos', filename);
      await writeFile(filepath, buffer);
      return NextResponse.json({ success: true, url: `/uploads/videos/${filename}` });
    } 
    
    if (isImage) {
      const filename = `img-${uniqueSuffix}.webp`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'images', filename);
      
      // Optimizaciya zobrazhen' cherez sharp. 
      // Zberigayemo originalni proporcii (krop robyt koristuvach sam do zavantazhennya),
      // ale obmezhuyemo max width 1920px dlya shvidkosti zavantazhennya
      await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filepath);
        
      return NextResponse.json({ success: true, url: `/uploads/images/${filename}` });
    }

    return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
