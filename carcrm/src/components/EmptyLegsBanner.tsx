'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Percent, Calendar, MapPin, ArrowRight, Route, CarFront } from 'lucide-react';
import { motion } from 'framer-motion';
import HighlightedTitle from './ui/HighlightedTitle';
import { withContentDefaults } from '../lib/contentDefaults';

type EmptyLegPromo = {
  id: string;
  title: string;
  discount: number;
  routeFrom?: string | null;
  routeTo?: string | null;
  dateStart?: string | null;
  carId?: string | null;
  active: boolean;
  source?: string;
  bookingId?: string;
  pickupRadiusKm?: number;
  pickupZoneText?: string;
  distanceKm?: number;
  originalPrice?: number;
  discountedPrice?: number;
  car?: {
    make: string;
    model: string;
    media?: { type: string; url: string; alt?: string | null; isCover?: boolean }[];
    images?: string[];
  } | null;
};

function getCover(promo: EmptyLegPromo) {
  const media = promo.car?.media || [];
  const cover = media.find((item) => item.isCover) || media[0];
  return cover?.url || promo.car?.images?.[0] || '';
}

function priceLabel(value?: number) {
  return value && value > 0 ? `€${value.toLocaleString('uk-UA')}` : null;
}

export default function EmptyLegsBanner({ cmsSettings = {} }: { cmsSettings?: Record<string, string> }) {
  const c = withContentDefaults(cmsSettings);
  const [promos, setPromos] = useState<EmptyLegPromo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data as EmptyLegPromo[] : [];
        const activePromos = list.filter((p) => p.active);
        activePromos.sort((a, b) => {
          if (!a.dateStart) return 1;
          if (!b.dateStart) return -1;
          return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime();
        });
        setPromos(activePromos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || promos.length === 0) return null;

  return (
    <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[100px]">
      <div className="flex items-center gap-4 mb-8">
        <HighlightedTitle text={c['empty_legs_title']} as="h2" className="font-headline-lg text-[32px] md:text-[40px] text-[#e4e2e3]" />
        <div className="h-[2px] flex-1 bg-gradient-to-r from-[#e9c349]/30 to-transparent"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {promos.map((promo, idx) => {
          const cover = getCover(promo);
          const oldPrice = priceLabel(promo.originalPrice);
          const newPrice = priceLabel(promo.discountedPrice);
          return (
            <motion.article
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-[#e9c349]/20 bg-[#13131a] shadow-2xl transition-colors hover:border-[#e9c349]/60"
            >
              <div className="grid min-h-[420px] md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[260px] overflow-hidden bg-[#080818]">
                  {cover ? (
                    <img src={cover} alt={promo.car ? `${promo.car.make} ${promo.car.model}` : promo.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full min-h-[260px] items-center justify-center text-[#56565f]">
                      <CarFront size={58} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080818]/95 via-[#080818]/20 to-transparent"></div>
                  <div className="absolute left-5 top-5 rounded-full bg-[#e9c349] px-4 py-2 text-sm font-black text-black shadow-[0_8px_24px_rgba(233,195,73,0.28)]">
                    -{promo.discount}%
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="mb-2 w-fit rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e9c349] backdrop-blur">
                      {promo.source === 'AUTO_EMPTY' ? 'Авто повертається' : 'Акційний рейс'}
                    </div>
                    <h3 className="m-0 text-2xl font-bold leading-tight text-white">{promo.title}</h3>
                    {promo.car && <p className="m-0 mt-2 text-sm text-[#c7c6ca]">{promo.car.make} {promo.car.model}</p>}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5 p-5">
                  <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Route size={17} className="text-[#e9c349]" /> Маршрут акції
                      </div>
                      {promo.distanceKm && <span className="text-xs font-bold text-[#8a8a93]">{Math.round(promo.distanceKm)} км</span>}
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#101018] p-4">
                      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#ffffff12_1px,transparent_1px),linear-gradient(90deg,#ffffff12_1px,transparent_1px)] [background-size:24px_24px]"></div>
                      <div className="relative flex min-h-[118px] items-center">
                        <div className="z-10 max-w-[42%]">
                          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#e9c349]/40 bg-[#e9c349]/15">
                            <MapPin size={18} className="text-[#e9c349]" />
                          </div>
                          <div className="text-sm font-bold text-white">{promo.routeFrom || c['empty_legs_anywhere']}</div>
                          <div className="mt-1 text-xs leading-4 text-[#8a8a93]">{promo.pickupZoneText || 'Старт акційного маршруту'}</div>
                        </div>
                        <div className="mx-3 flex-1">
                          <div className="relative h-1 rounded-full bg-gradient-to-r from-[#e9c349] via-[#e9c349]/50 to-white/20">
                            <ArrowRight size={18} className="absolute -right-1 -top-2 text-[#e9c349]" />
                          </div>
                        </div>
                        <div className="z-10 max-w-[36%] text-right">
                          <div className="ml-auto mb-2 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                            <span className="material-symbols-outlined text-[19px] text-[#e9c349]">home_pin</span>
                          </div>
                          <div className="text-sm font-bold text-white">{promo.routeTo || c['empty_legs_anywhere']}</div>
                          <div className="mt-1 text-xs leading-4 text-[#8a8a93]">напрямок бази</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-[#c7c6ca]">
                    {promo.dateStart && (
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-[#e9c349]" />
                        <span className="font-bold text-white">{new Date(promo.dateStart).toLocaleDateString('uk-UA')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#e9c349]" />
                      <span>{promo.routeFrom || c['empty_legs_anywhere']} <ArrowRight size={14} className="inline mx-1" /> {promo.routeTo || c['empty_legs_anywhere']}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e9c349]/20 bg-[#e9c349]/10 p-4">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#b9a35b]">Акційна ціна</div>
                        <div className="mt-1 flex items-baseline gap-3">
                          {oldPrice && <span className="text-lg font-bold text-[#8a8a93] line-through">{oldPrice}</span>}
                          <span className="text-3xl font-black text-[#e9c349]">{newPrice || `-${promo.discount}%`}</span>
                        </div>
                      </div>
                      <Percent size={24} className="text-[#e9c349]" />
                    </div>
                    <Link href={`/?promo=${promo.discount}&${promo.source === 'AUTO_EMPTY' ? `promoCode=${promo.id}` : `promotionId=${promo.id}`}&carId=${promo.carId || ''}#calculator`} className="block w-full rounded-xl bg-[#e9c349] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[0.99]">
                      {c['empty_legs_book_button']}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
