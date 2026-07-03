'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Camera, CarFront, Film, Images, Users } from 'lucide-react';

export type GalleryMediaItem = {
  id: string;
  type: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  isCover?: boolean;
};

export type GalleryCar = {
  id: string;
  slug?: string | null;
  make: string;
  model: string;
  year: number;
  capacity: number;
  luggageCapacity: number;
  comfortClass: string;
  bodyType?: string | null;
  luggageNote?: string | null;
  description?: string | null;
  media: GalleryMediaItem[];
};

const classOrder = ['VIP', 'Business', 'Premium', 'Executive'];

function classRank(value: string) {
  const direct = classOrder.findIndex((item) => value.toLowerCase().includes(item.toLowerCase()));
  return direct === -1 ? 99 : direct;
}

function cleanText(value?: string | null) {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function carDescription(car: GalleryCar) {
  const fromDb = cleanText(car.description);
  if (fromDb) return fromDb.length > 160 ? `${fromDb.slice(0, 157)}...` : fromDb;

  const type = car.bodyType || car.comfortClass;
  const luggage = car.luggageNote || `${car.luggageCapacity} валіз`;
  return `${type} з водієм: ${car.capacity} місць, ${luggage}.`;
}

function coverMedia(car: GalleryCar) {
  return car.media.find((item) => item.isCover) || car.media[0];
}

export default function GalleryShowcase({ cars }: { cars: GalleryCar[] }) {
  const [activeClass, setActiveClass] = useState('all');

  const classes = useMemo(() => {
    return Array.from(new Set(cars.map((car) => car.comfortClass || 'Premium')))
      .sort((a, b) => classRank(a) - classRank(b) || a.localeCompare(b, 'uk'));
  }, [cars]);

  const visibleCars = useMemo(() => {
    return cars
      .filter((car) => activeClass === 'all' || car.comfortClass === activeClass)
      .sort((a, b) => classRank(a.comfortClass) - classRank(b.comfortClass) || `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, 'uk'));
  }, [cars, activeClass]);

  if (!cars.length) {
    return (
      <section className="mx-auto max-w-[1280px] px-6 py-12 md:px-16">
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#13131a] p-10 text-center text-[#8a8a93]">
          <Camera className="mx-auto mb-4 text-[#e9c349]" size={34} />
          Автомобілі для галереї ще не додані.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-16">
      <div className="mb-8 flex flex-col gap-4 border-t border-white/10 pt-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">
            <Images size={16} /> Автомобілі
          </div>
          <h2 className="m-0 text-3xl font-black text-white md:text-4xl">Галерея автопарку</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveClass('all')}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${activeClass === 'all' ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}
          >
            Усі
          </button>
          {classes.map((className) => (
            <button
              key={className}
              type="button"
              onClick={() => setActiveClass(className)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${activeClass === className ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}
            >
              {className}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCars.map((car) => {
          const cover = coverMedia(car);
          const href = `/cars/${car.slug || car.id}`;
          const videos = car.media.filter((item) => item.type === 'video');

          return (
            <Link
              key={car.id}
              href={href}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#13131a] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#e9c349]/45 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#080818]">
                {cover ? (
                  cover.type === 'video' ? (
                    <video src={cover.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" muted loop playsInline />
                  ) : (
                    <img src={cover.url} alt={cover.alt || `${car.make} ${car.model}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-[#64646d]">
                    <Camera size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-[#e9c349]/30 bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#e9c349] backdrop-blur">
                  {car.comfortClass}
                </div>
                {videos.length > 0 && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    <Film size={14} /> відео
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="m-0 text-2xl font-black text-white">{car.make} {car.model}</h3>
                  <p className="m-0 mt-1 text-sm text-white/78">{car.year} • {car.bodyType || car.comfortClass}</p>
                </div>
              </div>

              <div className="p-5">
                <p className="m-0 min-h-[48px] text-sm leading-6 text-[#b9b8bf]">{carDescription(car)}</p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/10 bg-[#080818] p-3">
                    <Users className="mb-2 text-[#e9c349]" size={17} />
                    <div className="text-xs text-[#8a8a93]">Місць</div>
                    <div className="font-bold text-white">{car.capacity}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#080818] p-3">
                    <BriefcaseBusiness className="mb-2 text-[#e9c349]" size={17} />
                    <div className="text-xs text-[#8a8a93]">Валіз</div>
                    <div className="font-bold text-white">{car.luggageCapacity}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#080818] p-3">
                    <CarFront className="mb-2 text-[#e9c349]" size={17} />
                    <div className="text-xs text-[#8a8a93]">Рік</div>
                    <div className="font-bold text-white">{car.year}</div>
                  </div>
                </div>

                {car.media.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {car.media.slice(0, 4).map((item) => (
                      <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
                        {item.type === 'video' ? (
                          <>
                            <video src={item.url} className="h-full w-full object-cover opacity-85" muted />
                            <Film className="absolute left-1.5 top-1.5 text-white drop-shadow" size={14} />
                          </>
                        ) : (
                          <img src={item.url} alt={item.alt || `${car.make} ${car.model}`} className="h-full w-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm font-bold text-[#e9c349]">Відкрити авто</span>
                  <ArrowRight size={18} className="text-[#e9c349] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
