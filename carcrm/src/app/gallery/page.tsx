import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const cars = await prisma.car.findMany({ where: { status: 'AVAILABLE' } });
  const contentRows = await prisma.siteContent.findMany();
  const c = contentRows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  const allMedia: { type: 'image' | 'video', url: string, carId?: string, make?: string, model?: string }[] = [];
  
  if (c.standalone_gallery_media) {
    try { allMedia.push(...JSON.parse(c.standalone_gallery_media)); } catch (e) {}
  }
  
  cars.forEach(car => {
    car.images.forEach(img => allMedia.push({ type: 'image', url: img, carId: car.id, make: car.make, model: car.model }));
    car.videos.forEach(vid => allMedia.push({ type: 'video', url: vid, carId: car.id, make: car.make, model: car.model }));
  });

  return (
    <div className="bg-[#080818] text-[#e4e2e3] font-body-md min-h-screen flex flex-col pt-24 pb-16">
      
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#080818]/90 backdrop-blur-md border-b border-white/10">
        <nav className="flex justify-between items-center px-6 md:px-16 py-4 max-w-[1280px] mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 cursor-pointer flex-1">
            <img src={c['logo_url'] || '/logo.png'} alt="Logo" className="h-[40px] md:h-[50px] object-contain" />
          </Link>
          <div className="flex gap-8 items-center">
             <Link href="/" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">Головна</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16">
        <h1 className="font-display-lg text-[40px] md:text-[56px] text-white mb-4">Галерея Автопарку</h1>
        <p className="text-[#c7c6ca] mb-12 max-w-2xl">Перегляньте наш преміальний автопарк. Натисніть на будь-яке фото, щоб перейти до деталей автомобіля та оформити бронювання.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allMedia.map((media, idx) => (
            <Link href={media.carId ? `/cars/${media.carId}` : '#'} key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-[#13131a] cursor-pointer">
              {media.type === 'video' ? (
                <video src={media.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" muted loop autoPlay playsInline />
              ) : (
                <img src={media.url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-white text-4xl mb-2 drop-shadow-md">zoom_in</span>
                {media.make && <span className="text-[#e9c349] font-bold text-lg">{media.make} {media.model}</span>}
                <span className="text-white text-sm font-label-caps mt-2 border border-white/20 px-3 py-1 rounded-full bg-black/50">Детальніше</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
