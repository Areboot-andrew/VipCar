import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { Camera, Car, Images, ShieldCheck } from 'lucide-react';
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

  const badGalleryText = ['SEO', 'alt-', 'Живі', 'Підбір', 'сюрприз', 'абстракт'];
  const title = badGalleryText.some((token) => c['gallery_title']?.includes(token))
    ? 'Автопарк *First Line*'
    : (c['gallery_title'] || 'Автопарк *First Line*');
  const subtitleFromDb = c['gallery_subtitle'] || '';
  const subtitle = badGalleryText.some((token) => subtitleFromDb.includes(token))
    ? 'Автомобілі з водіями для приватних поїздок, бізнес-маршрутів та трансферів між містами.'
    : (subtitleFromDb || 'Автомобілі з водіями для приватних поїздок, бізнес-маршрутів та трансферів між містами.');

  const mediaCount = cars.reduce((total, car) => {
    const media = car.media.length > 0
      ? car.media
      : [
          ...car.images.map((url, index) => ({ id: `${car.id}-image-${index}`, type: 'image', url, alt: `${car.make} ${car.model}`, caption: null, role: 'gallery', isCover: index === 0 })),
          ...car.videos.map((url, index) => ({ id: `${car.id}-video-${index}`, type: 'video', url, alt: `${car.make} ${car.model} відео`, caption: null, role: 'gallery', isCover: false })),
        ];
    return total + media.length;
  }, 0);

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
      description: car.description,
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
        <section className="mx-auto max-w-[1280px] px-6 py-14 text-center md:px-16 md:py-16">
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
              <div className="text-2xl font-black text-white">{mediaCount}</div>
              <div className="mt-1 text-sm text-[#8a8a93]">фото і відео</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#13131a] p-5 text-left">
              <ShieldCheck className="mb-3 text-[#e9c349]" size={24} />
              <div className="text-2xl font-black text-white">{comfortClasses.length}</div>
              <div className="mt-1 text-sm text-[#8a8a93]">класи комфорту</div>
            </div>
          </div>
        </section>

        <GalleryShowcase cars={galleryCars} />
      </main>
    </div>
  );
}
