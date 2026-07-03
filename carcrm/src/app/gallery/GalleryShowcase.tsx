'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Camera, Car, Images, Users } from 'lucide-react';

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
  media: GalleryMediaItem[];
};

const classOrder = ['VIP', 'Business', 'Premium', 'Executive'];

function classRank(value: string) {
  const direct = classOrder.findIndex((item) => value.toLowerCase().includes(item.toLowerCase()));
  return direct === -1 ? 99 : direct;
}

export default function GalleryShowcase({ cars }: { cars: GalleryCar[] }) {
  const [activeClass, setActiveClass] = useState('all');
  const [activeCarId, setActiveCarId] = useState(cars[0]?.id || '');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const classes = useMemo(() => {
    return Array.from(new Set(cars.map((car) => car.comfortClass || 'Premium')))
      .sort((a, b) => classRank(a) - classRank(b) || a.localeCompare(b, 'uk'));
  }, [cars]);

  const visibleCars = useMemo(() => {
    return cars
      .filter((car) => activeClass === 'all' || car.comfortClass === activeClass)
      .sort((a, b) => classRank(a.comfortClass) - classRank(b.comfortClass) || a.make.localeCompare(b.make, 'uk'));
  }, [cars, activeClass]);

  const activeCar = visibleCars.find((car) => car.id === activeCarId) || visibleCars[0] || cars[0];
  const activeMedia = activeCar?.media?.[activeMediaIndex] || activeCar?.media?.[0];

  const chooseClass = (className: string) => {
    setActiveClass(className);
    const nextCar = cars.find((car) => className === 'all' || car.comfortClass === className);
    setActiveCarId(nextCar?.id || '');
    setActiveMediaIndex(0);
  };

  const chooseCar = (carId: string) => {
    setActiveCarId(carId);
    setActiveMediaIndex(0);
  };

  if (!activeCar) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 md:px-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">
            <Images size={16} /> Жива галерея
          </div>
          <h2 className="m-0 text-3xl font-black text-white md:text-4xl">Оберіть авто і перегляньте фото</h2>
          <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-[#c7c6ca]">
            Фото змінюються по вибраному автомобілю. Так клієнт бачить не абстрактну галерею, а конкретний клас, салон, багаж і зовнішній вигляд авто перед бронюванням.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => chooseClass('all')}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${activeClass === 'all' ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}
          >
            Усі
          </button>
          {classes.map((className) => (
            <button
              key={className}
              type="button"
              onClick={() => chooseClass(className)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${activeClass === className ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}
            >
              {className}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131a]">
          <div className="relative aspect-[16/10] bg-[#080818]">
            {activeMedia ? (
              activeMedia.type === 'video' ? (
                <video src={activeMedia.url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={activeMedia.url} alt={activeMedia.alt || `${activeCar.make} ${activeCar.model}`} className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-[#64646d]">
                <Camera size={42} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
              <div className="mb-3 inline-flex rounded-full border border-[#e9c349]/30 bg-black/45 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#e9c349] backdrop-blur">
                {activeCar.comfortClass}
              </div>
              <h3 className="m-0 text-2xl font-black text-white md:text-4xl">{activeCar.make} {activeCar.model}</h3>
              <div className="mt-4 grid max-w-xl grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur">
                  <Users className="mb-2 text-[#e9c349]" size={18} />
                  <span className="block text-xs uppercase tracking-widest text-[#8a8a93]">Місць</span>
                  <strong className="text-white">{activeCar.capacity}</strong>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur">
                  <BriefcaseBusiness className="mb-2 text-[#e9c349]" size={18} />
                  <span className="block text-xs uppercase tracking-widest text-[#8a8a93]">Валіз</span>
                  <strong className="text-white">{activeCar.luggageCapacity}</strong>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur">
                  <Car className="mb-2 text-[#e9c349]" size={18} />
                  <span className="block text-xs uppercase tracking-widest text-[#8a8a93]">Рік</span>
                  <strong className="text-white">{activeCar.year}</strong>
                </div>
              </div>
            </div>
          </div>

          {activeCar.media.length > 1 && (
            <div className="grid grid-cols-4 gap-2 border-t border-white/10 p-3 md:grid-cols-6">
              {activeCar.media.slice(0, 12).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMediaIndex(index)}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-lg border bg-[#080818] ${activeMediaIndex === index ? 'border-[#e9c349]' : 'border-white/10 hover:border-white/30'}`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-110" muted />
                  ) : (
                    <img src={item.url} alt={item.alt || `${activeCar.make} ${activeCar.model}`} className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-110" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {visibleCars.map((car) => (
            <button
              key={car.id}
              type="button"
              onClick={() => chooseCar(car.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${activeCar.id === car.id ? 'border-[#e9c349] bg-[#e9c349]/10' : 'border-white/10 bg-[#13131a] hover:border-white/25'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{car.make} {car.model}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-[#e9c349]">{car.comfortClass}</div>
                </div>
                <ArrowRight className={activeCar.id === car.id ? 'text-[#e9c349]' : 'text-[#64646d]'} size={18} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#c7c6ca]">
                <span className="rounded-full bg-white/5 px-3 py-1">{car.year}</span>
                <span className="rounded-full bg-white/5 px-3 py-1">{car.capacity} місць</span>
                <span className="rounded-full bg-white/5 px-3 py-1">{car.luggageCapacity} валіз</span>
              </div>
            </button>
          ))}

          <Link href={`/cars/${activeCar.slug || activeCar.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e9c349]/40 px-5 py-4 text-sm font-bold text-[#e9c349] transition-colors hover:bg-[#e9c349] hover:text-black">
            Відкрити сторінку авто <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
