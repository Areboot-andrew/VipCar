'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Percent, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyLegsBanner() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        // Filter only active promos
        const activePromos = data.filter((p: any) => p.active);
        // Sort by dateStart (closest first)
        activePromos.sort((a: any, b: any) => {
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
        <h2 className="font-headline-lg text-[32px] md:text-[40px] text-[#e4e2e3]">
          Гарячі пропозиції <span className="text-[#e9c349]">Empty Legs</span>
        </h2>
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
              <h3 className="text-xl font-bold text-white z-10">{promo.title}</h3>
              <div className="bg-[#e9c349] text-black font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 z-10 shadow-[0_2px_10px_rgba(233,195,73,0.3)]">
                <Percent size={14} /> {promo.discount}%
              </div>
            </div>

            <div className="space-y-3 mb-6 z-10 relative">
              <div className="flex items-center gap-3 text-[#c7c6ca]">
                <MapPin size={16} className="text-[#e9c349]" />
                <span className="text-sm">{promo.routeFrom || 'Будь-яке'} <ArrowRight size={14} className="inline mx-1" /> {promo.routeTo || 'Будь-яке'}</span>
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

            <Link href={`/#calculator?promo=${promo.discount}&carId=${promo.carId || ''}`} className="block w-full text-center py-3 rounded-xl border border-[#e9c349] text-[#e9c349] hover:bg-[#e9c349] hover:text-black font-bold transition-all z-10 relative">
              Забронювати зі знижкою
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
