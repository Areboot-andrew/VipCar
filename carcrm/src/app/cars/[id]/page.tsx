'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check, Users, Fuel, Calendar, Star, X } from 'lucide-react';

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/cars/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setCar(data);
        setReviews(data.reviews || []);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (session?.user) {
      setReviewForm(prev => ({ ...prev, author: session.user.name || '' }));
      fetch(`/api/cars/${params.id}/can-review`)
        .then(res => res.json())
        .then(data => {
          if (data.canReview) setCanReview(true);
        })
        .catch(console.error);
    }
  }, [session, params.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/cars/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setReviewForm({ author: '', rating: 5, text: '' });
      }
    } catch (err) {
      console.error(err);
    }
    setSubmittingReview(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#080818] flex items-center justify-center text-[#e9c349]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e9c349]"></div></div>;
  }

  if (!car) {
    return <div className="min-h-screen bg-[#080818] flex items-center justify-center text-white">Автомобіль не знайдено</div>;
  }

  const allMedia = [...(car.images || []), ...(car.videos || [])];
  const features = car.features && car.features !== '[]' ? JSON.parse(car.features) : [];
  
  // Calculate average rating
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <div className="bg-[#080818] text-[#e4e2e3] min-h-screen font-body-md selection:bg-[#e9c349] selection:text-black">
      
      {/* NavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-[#080818]/80 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="relative z-50 block">
          <img src="/logo.png" alt="First Line Transfer" className="h-[40px] md:h-[50px] object-contain" />
        </Link>
        <button onClick={() => router.back()} className="text-[#c7c6ca] hover:text-white flex items-center gap-2 font-label-caps uppercase text-xs tracking-widest transition-colors">
          <ArrowLeft size={16} /> Назад
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] flex flex-col justify-end">
        <div className="absolute inset-0 z-0">
          {car.images && car.images.length > 0 ? (
            <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#13131a]"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080818]/80 via-transparent to-[#080818]"></div>
        </div>
        
        <div className="relative z-10 max-w-[1280px] w-full mx-auto px-[24px] md:px-[64px] pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md border border-[#e9c349]/30 rounded-full px-4 py-1.5 mb-4">
              <Star className="text-[#e9c349]" size={16} fill="#e9c349" />
              <span className="text-[#e9c349] font-bold text-sm">{avgRating} ({reviews.length} відгуків)</span>
            </div>
            <h1 className="font-display-lg text-[40px] md:text-[80px] text-white leading-none mb-2">{car.make}</h1>
            <h2 className="font-headline-lg text-[24px] md:text-[40px] text-[#e9c349]">{car.model}</h2>
          </motion.div>
        </div>
      </section>

      {/* Content Layout */}
      <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] py-12 md:py-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Details & Gallery */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Main Info Blocks */}
          <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-8">
            <div className="flex flex-col items-center justify-center text-center gap-2 border-r border-white/10 last:border-0">
              <Users className="text-[#e9c349]" size={28} />
              <span className="text-[#c7c6ca] text-xs uppercase tracking-widest font-bold">Місць</span>
              <span className="text-white font-display-md text-2xl">{car.capacity}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-2 border-r border-white/10 last:border-0">
              <Calendar className="text-[#e9c349]" size={28} />
              <span className="text-[#c7c6ca] text-xs uppercase tracking-widest font-bold">Рік</span>
              <span className="text-white font-display-md text-2xl">{car.year}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <Fuel className="text-[#e9c349]" size={28} />
              <span className="text-[#c7c6ca] text-xs uppercase tracking-widest font-bold">Двигун</span>
              <span className="text-white font-display-md text-xl">{car.fuelType}</span>
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div className="prose prose-invert prose-lg max-w-none prose-p:text-[#c7c6ca] prose-headings:text-white prose-a:text-[#e9c349]" dangerouslySetInnerHTML={{ __html: car.description }}></div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="font-headline-md text-2xl text-white mb-6">Особливості та Комплектація</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-[#13131a] p-4 rounded-xl border border-white/5">
                    <span className="material-symbols-outlined text-[#e9c349]">{f.icon || 'check_circle'}</span>
                    <span className="text-[#e4e2e3]">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Gallery */}
          {allMedia.length > 0 && (
            <div>
              <h3 className="font-headline-md text-2xl text-white mb-6">Галерея</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allMedia.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative" onClick={() => openLightbox(i)}>
                    {url.includes('.mp4') ? (
                       <video src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" muted loop playsInline />
                    ) : (
                       <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: CTA & Reviews */}
        <div className="space-y-8">
          
          {/* Booking Card */}
          <div className="bg-[#13131a] rounded-3xl p-8 border border-[#e9c349]/30 shadow-[0_0_40px_rgba(233,195,73,0.1)] sticky top-28">
            <h3 className="font-headline-md text-2xl text-white mb-4">Бронювання</h3>
            <p className="text-[#c7c6ca] mb-8 text-sm">Забронюйте цей {car.make} прямо зараз. Ми гарантуємо ідеальну чистоту та пунктуальність.</p>
            <Link href={`/#calculator?carId=${car.id}`} className="block w-full text-center bg-[#D4AF37] hover:bg-[#e9c349] text-black font-bold py-4 rounded-xl transition-all uppercase tracking-wider text-sm shadow-[0_4px_15px_rgba(233,195,73,0.4)]">
              Перейти до калькулятора
            </Link>
          </div>

          {/* Reviews */}
          <div className="bg-[#13131a] rounded-3xl p-8 border border-white/10">
            <h3 className="font-headline-md text-xl text-white mb-6 flex items-center justify-between">
              Відгуки <span className="bg-white/10 text-white text-sm px-3 py-1 rounded-full">{reviews.length}</span>
            </h3>
            
            <div className="space-y-6 mb-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {reviews.length === 0 ? (
                <p className="text-[#8a8a93] text-sm text-center italic">Поки немає відгуків.</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-white text-sm">{r.author}</div>
                        <div className="text-xs text-[#8a8a93]">{new Date(r.date).toLocaleDateString('uk-UA')}</div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={14} className={j < r.rating ? "text-[#e9c349] fill-[#e9c349]" : "text-white/20"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#c7c6ca] text-sm leading-relaxed">{r.text}</p>
                  </div>
                ))
              )}
            </div>

            {canReview && (
              <form onSubmit={handleSubmitReview} className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-4">
                <h4 className="text-white font-bold text-sm">Ваш відгук</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                      <Star size={24} className={star <= reviewForm.rating ? "text-[#e9c349] fill-[#e9c349]" : "text-white/20"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl p-3 text-white focus:border-[#e9c349] outline-none text-sm resize-none"
                  placeholder="Розкажіть про ваш досвід поїздки..."
                  value={reviewForm.text}
                  onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })}
                />
                <button type="submit" disabled={submittingReview} className="gold-button font-bold rounded-xl py-3 text-sm">
                  {submittingReview ? 'Відправка...' : 'Опублікувати'}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button onClick={() => setLightboxOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                <X size={32} />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4">
              <Swiper
                initialSlide={lightboxIndex}
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true, type: 'fraction' }}
                className="w-full max-w-[1200px] h-[80vh] lightbox-swiper"
              >
                {allMedia.map((url, i) => (
                  <SwiperSlide key={i} className="flex items-center justify-center">
                    {url.includes('.mp4') ? (
                      <video src={url} className="max-w-full max-h-full object-contain rounded-xl" controls autoPlay />
                    ) : (
                      <img src={url} alt={`Gallery ${i}`} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
