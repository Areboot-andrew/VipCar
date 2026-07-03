import React from 'react';
import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { ArrowRight, Camera, Film, Images, Sparkles } from 'lucide-react';
import { withContentDefaults } from '@/lib/contentDefaults';
import HighlightedTitle from '@/components/ui/HighlightedTitle';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

async function getContent() {
  try {
    const rows = await prisma.siteContent.findMany();
    return withContentDefaults(rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>));
  } catch {
    return withContentDefaults();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    title: c['gallery_seo_title'] || `Галерея автопарку - ${c['brand_name']}`,
    description: c['gallery_seo_description'] || 'Фото і відео преміального автопарку для VIP-трансферів Європою та Україною.',
    openGraph: {
      title: c['gallery_title'],
      description: c['gallery_subtitle'] || c['site_meta_description'],
      type: 'website',
    },
  };
}

export default async function GalleryPage() {
  const c = await getContent();
  const cars = await prisma.car.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
    include: {
      media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
    },
  });

  const galleryItems = cars.flatMap((car) => {
    const media = car.media.length > 0
      ? car.media
      : [
          ...car.images.map((url, index) => ({ id: `${car.id}-image-${index}`, type: 'image', url, alt: `${car.make} ${car.model}`, caption: null, role: 'gallery', isCover: index === 0 })),
          ...car.videos.map((url, index) => ({ id: `${car.id}-video-${index}`, type: 'video', url, alt: `${car.make} ${car.model} відео`, caption: null, role: 'gallery', isCover: false })),
        ];

    return media.map((item) => ({
      ...item,
      carId: car.slug || car.id,
      carTitle: `${car.make} ${car.model}`,
      carMeta: `${car.year} • ${car.capacity} місць • ${car.comfortClass}`,
    }));
  });

  const heroItems = galleryItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#080818] text-[#e4e2e3]">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#080818]/90 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-4 md:px-16">
          <Link href="/" className="flex items-center gap-3">
            <img src={c['logo_url']} alt={c['brand_name']} className="h-[40px] object-contain md:h-[50px]" />
          </Link>
          <Link href="/" className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#c7c6ca] transition-colors hover:text-[#e4e2e3]">
            {c['menu_home']}
          </Link>
        </nav>
      </header>

      <main className="pt-24">
        <section className="mx-auto grid max-w-[1280px] gap-10 px-6 py-12 md:px-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">
              <Camera size={16} /> {c['menu_gallery']}
            </div>
            <HighlightedTitle
              text={c['gallery_title'] || 'Галерея *автопарку*'}
              as="h1"
              className="text-[40px] font-black leading-tight text-white md:text-[64px]"
            />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#c7c6ca]">
              {c['gallery_subtitle'] || 'Реальні фото та відео автомобілів, які клієнт може обрати для трансферу.'}
            </p>
          </div>

          {heroItems.length > 0 && (
            <div className="grid h-[520px] grid-cols-6 grid-rows-6 gap-3">
              {heroItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/cars/${item.carId}`}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[#13131a] ${
                    index === 0 ? 'col-span-4 row-span-6' : index === 1 ? 'col-span-2 row-span-3' : 'col-span-2 row-span-3'
                  }`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" muted loop autoPlay playsInline />
                  ) : (
                    <img src={item.url} alt={item.alt || item.carTitle} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-sm font-bold text-white">{item.carTitle}</div>
                    <div className="mt-1 text-xs text-[#c7c6ca]">{item.carMeta}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-16">
          <div className="mb-8 flex flex-col gap-3 border-t border-white/10 pt-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="m-0 text-2xl font-bold text-white">Автомобілі в галереї</h2>
              <p className="m-0 mt-2 text-sm text-[#8a8a93]">Кожен блок веде на SEO-сторінку конкретного авто.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8a8a93]">
              <Images size={18} className="text-[#e9c349]" /> {galleryItems.length} медіафайлів
            </div>
          </div>

          <div className="grid gap-8">
            {cars.map((car) => {
              const media = car.media.length > 0
                ? car.media
                : car.images.map((url, index) => ({ id: `${car.id}-${index}`, type: 'image', url, alt: `${car.make} ${car.model}`, caption: null, isCover: index === 0 }));
              const cover = media.find((item: any) => item.isCover) || media[0];

              return (
                <article key={car.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#13131a]">
                  <div className="grid lg:grid-cols-[420px_1fr]">
                    <Link href={`/cars/${car.slug || car.id}`} className="group relative min-h-[300px] overflow-hidden bg-[#080818]">
                      {cover ? (
                        cover.type === 'video' ? (
                          <video src={cover.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" muted loop autoPlay playsInline />
                        ) : (
                          <img src={cover.url} alt={cover.alt || `${car.make} ${car.model}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        )
                      ) : (
                        <div className="flex h-full min-h-[300px] items-center justify-center text-[#64646d]">
                          <Sparkles />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                        {car.comfortClass}
                      </div>
                    </Link>

                    <div className="p-6 md:p-8">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="m-0 text-2xl font-bold text-white">{car.make} {car.model}</h3>
                          <p className="m-0 mt-2 text-sm text-[#8a8a93]">{car.year} • {car.capacity} місць • {car.luggageCapacity} валіз • {car.fuelType}</p>
                        </div>
                        <Link href={`/cars/${car.slug || car.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[#e9c349]/40 px-4 py-2 text-sm font-bold text-[#e9c349] transition-colors hover:bg-[#e9c349] hover:text-black">
                          Сторінка авто <ArrowRight size={16} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {media.slice(0, 8).map((item: any) => (
                          <Link key={item.id} href={`/cars/${car.slug || car.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
                            {item.type === 'video' ? (
                              <>
                                <video src={item.url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" muted />
                                <Film className="absolute left-2 top-2 text-white drop-shadow" size={18} />
                              </>
                            ) : (
                              <img src={item.url} alt={item.alt || `${car.make} ${car.model}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
