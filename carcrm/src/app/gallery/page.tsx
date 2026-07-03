import React from 'react';
import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Camera, Car, Film, Images, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { withContentDefaults } from '@/lib/contentDefaults';
import HighlightedTitle from '@/components/ui/HighlightedTitle';
import GalleryShowcase, { type GalleryCar } from './GalleryShowcase';

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

  const title = c['gallery_title']?.includes('SEO') ? 'Автопарк *для трансферу*' : (c['gallery_title'] || 'Автопарк *для трансферу*');
  const subtitleFromDb = c['gallery_subtitle'] || '';
  const subtitle = subtitleFromDb.includes('SEO') || subtitleFromDb.includes('alt-тексти')
    ? 'Живі фото і відео автомобілів з водіями: салон, багаж, клас авто і реальний вигляд перед бронюванням. Оберіть машину, перегляньте медіа і відкрийте сторінку конкретного авто.'
    : (subtitleFromDb || 'Живі фото і відео автомобілів з водіями: салон, багаж, клас авто і реальний вигляд перед бронюванням.');

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
      carMeta: `${car.year} • ${car.capacity} місць • ${car.luggageCapacity} валіз • ${car.comfortClass}`,
    }));
  });

  const galleryCars: GalleryCar[] = cars.map((car) => {
    const media = car.media.length > 0
      ? car.media
      : [
          ...car.images.map((url, index) => ({ id: `${car.id}-image-${index}`, type: 'image', url, alt: `${car.make} ${car.model}`, caption: null, isCover: index === 0 })),
          ...car.videos.map((url, index) => ({ id: `${car.id}-video-${index}`, type: 'video', url, alt: `${car.make} ${car.model} відео`, caption: null, isCover: false })),
        ];

    return {
      id: car.id,
      slug: car.slug,
      make: car.make,
      model: car.model,
      year: car.year,
      capacity: car.capacity,
      luggageCapacity: car.luggageCapacity,
      comfortClass: car.comfortClass || 'Premium',
      bodyType: car.bodyType,
      luggageNote: car.luggageNote,
      media: media.map((item: any) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        alt: item.alt,
        caption: item.caption,
        isCover: item.isCover,
      })),
    };
  });

  const comfortClasses = Array.from(new Set(cars.map((car) => car.comfortClass || 'Premium')));

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
        <section className="mx-auto max-w-[1280px] px-6 py-14 text-center md:px-16 md:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">
            <Camera size={16} /> {c['menu_gallery']}
          </div>
          <HighlightedTitle
            text={title}
            as="h1"
            className="mx-auto max-w-4xl text-[42px] font-black leading-tight text-white md:text-[76px]"
          />
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#c7c6ca]">
            {subtitle}
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#13131a] p-5 text-left">
              <Car className="mb-3 text-[#e9c349]" size={24} />
              <div className="text-2xl font-black text-white">{cars.length}</div>
              <div className="mt-1 text-sm text-[#8a8a93]">авто з водіями</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#13131a] p-5 text-left">
              <Images className="mb-3 text-[#e9c349]" size={24} />
              <div className="text-2xl font-black text-white">{galleryItems.length}</div>
              <div className="mt-1 text-sm text-[#8a8a93]">фото і відео</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#13131a] p-5 text-left">
              <ShieldCheck className="mb-3 text-[#e9c349]" size={24} />
              <div className="text-2xl font-black text-white">{comfortClasses.length}</div>
              <div className="mt-1 text-sm text-[#8a8a93]">класи комфорту</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 pb-8 md:px-16">
          <div className="grid gap-4 border-y border-white/10 py-8 md:grid-cols-3">
            <div className="flex gap-4">
              <Users className="mt-1 shrink-0 text-[#e9c349]" size={24} />
              <div>
                <h2 className="m-0 text-lg font-bold text-white">Підбір під пасажирів</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-[#8a8a93]">На сторінці авто видно місткість, клас і реальні фото салону без зайвої технічної каші.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <BriefcaseBusiness className="mt-1 shrink-0 text-[#e9c349]" size={24} />
              <div>
                <h2 className="m-0 text-lg font-bold text-white">Багаж без сюрпризів</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-[#8a8a93]">Кожна картка показує валізи і клас, щоб клієнт одразу розумів, чи авто підходить.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Sparkles className="mt-1 shrink-0 text-[#e9c349]" size={24} />
              <div>
                <h2 className="m-0 text-lg font-bold text-white">Живі фото авто</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-[#8a8a93]">Великий перегляд і мініатюри допомагають оцінити авто до переходу в бронювання.</p>
              </div>
            </div>
          </div>
        </section>

        <GalleryShowcase cars={galleryCars} />

        <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-16">
          <div className="mb-8 flex flex-col gap-3 border-t border-white/10 pt-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="m-0 text-2xl font-bold text-white">Автомобілі для поїздок</h2>
              <p className="m-0 mt-2 text-sm text-[#8a8a93]">Оберіть авто за класом, кількістю місць і багажем. Картка відкриває сторінку авто з фото, комплектацією і бронюванням.</p>
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
                          <p className="m-0 mt-2 text-sm text-[#8a8a93]">{car.year} • {car.capacity} місць • {car.luggageCapacity} валіз • {car.comfortClass || car.bodyType || 'Premium'}</p>
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
