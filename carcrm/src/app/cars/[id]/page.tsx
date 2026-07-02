'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

export default function CarDetailsPage() {
  const params = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cars/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setCar(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-[#080818] flex items-center justify-center text-[#e9c349]">Завантаження...</div>;
  }

  if (!car) {
    return <div className="min-h-screen bg-[#080818] flex items-center justify-center text-white">Автомобіль не знайдено</div>;
  }

  const allMedia = [...(car.images || []), ...(car.videos || [])];
  const features = car.features && car.features !== '[]' ? JSON.parse(car.features) : [];
  const reviews = car.reviews || [];

  return (
    <div className="bg-[#080818] text-white min-h-screen font-body-md selection:bg-[#e9c349] selection:text-black">
      {/* NavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-[#080818]/80 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="relative z-50 block">
          <img src="/logo.png" alt="First Line Transfer" className="h-[40px] md:h-[50px] object-contain" />
        </Link>
        <Link href="/" className="text-[#c7c6ca] hover:text-white flex items-center gap-2 font-label-caps uppercase text-xs tracking-widest transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> На головну
        </Link>
      </nav>

      {/* Hero Gallery Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] pt-20">
        {allMedia.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            effect="fade"
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="w-full h-full"
          >
            {allMedia.map((mediaUrl: string, idx: number) => {
              const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');
              return (
                <SwiperSlide key={idx}>
                  <div className="w-full h-full relative">
                    {isVideo ? (
                      <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={mediaUrl} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080818] via-[#080818]/40 to-transparent"></div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        ) : (
          <div className="w-full h-full bg-[#1b1b1c] flex items-center justify-center">
            <span className="material-symbols-outlined text-white/20 text-8xl">directions_car</span>
          </div>
        )}

        {/* Hero Title Overlay */}
        <div className="absolute bottom-0 left-0 w-full z-10 px-6 md:px-16 pb-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end gap-6"
          >
            <div>
              <span className="text-[#e9c349] font-label-caps tracking-widest uppercase mb-2 block">{car.year} Рік • Преміум Клас</span>
              <h1 className="font-headline-xl text-5xl md:text-7xl text-white font-bold drop-shadow-lg">{car.make} <span className="font-light">{car.model}</span></h1>
            </div>
            <div className="text-left md:text-right">
              <div className="text-[#e9c349] font-bold text-4xl mb-4 drop-shadow-md">
                €{car.baseRate} <span className="text-sm text-[#c7c6ca] font-normal tracking-widest uppercase">/ км</span>
              </div>
              <Link href={`/?carId=${car.id}#calculator`} className="inline-block bg-[#e9c349] text-black font-label-caps uppercase tracking-widest font-bold px-12 py-4 rounded-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(233,195,73,0.4)] transition-all">
                Бронювати
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-6 md:px-16 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* Left Column (Description & Features) */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Description */}
          {car.description && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-white border-b border-white/10 pb-4">Огляд Автомобіля</h2>
              <div className="prose prose-invert prose-lg text-[#c7c6ca] max-w-none prose-a:text-[#e9c349]" dangerouslySetInnerHTML={{ __html: car.description }} />
            </motion.section>
          )}

          {/* Features */}
          {features.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-8 text-white border-b border-white/10 pb-4">Особливості (Features)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {features.map((f: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-[#e9c349]/50 transition-colors">
                    <span className="material-symbols-outlined text-[#e9c349] text-4xl mb-4">{f.icon || 'star'}</span>
                    <span className="text-white font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </div>

        {/* Right Column (Specs & Reviews) */}
        <div className="space-y-16">
          
          {/* Specs Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#111122] border border-white/10 p-8 rounded-3xl shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-[#e9c349]">Характеристики</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[#c7c6ca]">Пасажири</span>
                <span className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span> {car.capacity}</span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[#c7c6ca]">Тип палива</span>
                <span className="text-white font-bold">{car.fuelType}</span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[#c7c6ca]">Витрата (Місто)</span>
                <span className="text-white font-bold">{car.fuelConsumptionCity} л/100км</span>
              </li>
              <li className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[#c7c6ca]">Витрата (Траса)</span>
                <span className="text-white font-bold">{car.fuelConsumptionHighway} л/100км</span>
              </li>
            </ul>
          </motion.div>

          {/* Reviews Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Відгуки клієнтів</h3>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 relative">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-white text-lg">{r.author}</span>
                      <div className="flex text-[#e9c349] text-sm">{Array(r.rating).fill('★').join('')}</div>
                    </div>
                    <p className="text-[#c7c6ca] italic mb-4">"{r.text}"</p>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Відгуків для цього автомобіля поки що немає. Станьте першим!</p>
            )}
          </motion.div>

        </div>
      </main>

    </div>
  );
}
