'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Percent, Calendar, MapPin, ArrowRight } from 'lucide-react';
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
  car?: {
    make: string;
    model: string;
  } | null;
};

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo, idx) => (
          <motion.div 
            key={promo.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#13131a] rounded-2xl p-6 border border-[#e9c349]/20 hover:border-[#e9c349]/60 transition-colors shadow-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e9c349]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#e9c349]/20 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="z-10">
                {promo.source === 'AUTO_EMPTY' && (
                  <div className="mb-2 w-fit rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e9c349]">
                    Авто повертається
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{promo.title}</h3>
              </div>
              <div className="bg-[#e9c349] text-black font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 z-10 shadow-[0_2px_10px_rgba(233,195,73,0.3)]">
                <Percent size={14} /> {promo.discount}%
              </div>
            </div>

            <div className="space-y-3 mb-6 z-10 relative">
              {promo.source === 'AUTO_EMPTY' && (
                <div className="rounded-xl border border-white/10 bg-[#080818]/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-[#8a8a93]">
                    <span>Зона підбору</span>
                    <span className="text-[#e9c349]">до {promo.pickupRadiusKm || 50} км</span>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e9c349]/40 bg-[#e9c349]/10">
                      <div className="absolute h-8 w-8 rounded-full border border-[#e9c349]/30"></div>
                      <MapPin size={16} className="text-[#e9c349]" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#e9c349]/70 to-white/15"></div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <span className="material-symbols-outlined text-[18px] text-[#e9c349]">home_pin</span>
                    </div>
                  </div>
                  <p className="m-0 mt-3 text-xs leading-5 text-[#c7c6ca]">{promo.pickupZoneText}</p>
                </div>
              )}

              <div className="flex items-center gap-3 text-[#c7c6ca]">
                <MapPin size={16} className="text-[#e9c349]" />
                <span className="text-sm">{promo.routeFrom || c['empty_legs_anywhere']} <ArrowRight size={14} className="inline mx-1" /> {promo.routeTo || c['empty_legs_anywhere']}</span>
              </div>
              
              {promo.dateStart && (
                <div className="flex items-center gap-3 text-[#c7c6ca]">
                  <Calendar size={16} className="text-[#e9c349]" />
                  <span className="text-sm font-bold text-white">{new Date(promo.dateStart).toLocaleDateString('uk-UA')}</span>
                </div>
              )}
              
              {promo.car && (
                <div className="flex items-center gap-3 text-[#c7c6ca]">
                  <span className="material-symbols-outlined text-[#e9c349] text-[16px]">directions_car</span>
                  <span className="text-sm">{promo.car.make} {promo.car.model}</span>
                </div>
              )}
            </div>

            <Link href={`/?promo=${promo.discount}&${promo.source === 'AUTO_EMPTY' ? `promoCode=${promo.id}` : `promotionId=${promo.id}`}&carId=${promo.carId || ''}#calculator`} className="block w-full text-center py-3 rounded-xl border border-[#e9c349] text-[#e9c349] hover:bg-[#e9c349] hover:text-black font-bold transition-all z-10 relative">
              {c['empty_legs_book_button']}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
