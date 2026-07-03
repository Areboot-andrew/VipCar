'use client';

import { ArrowRight, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from 'next/link';

interface MarqueeGalleryProps {
  media: { type: 'image' | 'video', url: string, carId?: string, title?: string, alt?: string }[];
  title?: string;
  subtitle?: string;
}

export default function MarqueeGallery({ media, title, subtitle }: MarqueeGalleryProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!media || media.length === 0) return null;

  // We need enough items to scroll smoothly. If there are few items, we duplicate them many times.
  const marqueeItems = [...media, ...media, ...media, ...media, ...media, ...media];

  return (
    <section className="py-16 md:py-24 overflow-hidden w-full" id="gallery">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-8 md:mb-16"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">
              <Camera size={15} /> Галерея
            </span>
            {title && (
              <h2 className="font-headline-lg text-[40px] md:text-[56px] text-white" dangerouslySetInnerHTML={{ __html: title }}></h2>
            )}
            {subtitle && (
              <p className="text-[#c7c6ca] mt-4 max-w-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}></p>
            )}
          </div>
          <Link href="/gallery" className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e9c349]/40 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#e9c349] transition-colors hover:bg-[#e9c349] hover:text-black">
            Вся галерея <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>

      <div className="relative w-full flex overflow-hidden">
        {/* Left and Right Fade Gradients for a seamless infinite scroll effect */}
        <div className="absolute left-0 top-0 bottom-0 w-[50px] md:w-[150px] bg-gradient-to-r from-[#080818] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[50px] md:w-[150px] bg-gradient-to-l from-[#080818] to-transparent z-10 pointer-events-none"></div>

        <motion.div
          className="flex gap-4 md:gap-8 px-4"
          animate={{ x: isHovered ? "0%" : ["0%", "-50%"] }} 
          transition={{
            duration: media.length * 10,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {marqueeItems.map((item, index) => {
            const innerContent = (
              <div
                className="group relative w-[280px] md:w-[450px] aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-[#1b1b1c] cursor-pointer shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {item.type === 'video' ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-6xl drop-shadow-lg">play_circle</span>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || item.title || 'Gallery Item'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                {/* Optional Glassmorphism overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-between gap-3 p-6">
                  <div className="min-w-0">
                    {item.title && <div className="truncate text-lg font-bold text-white">{item.title}</div>}
                    {item.carId && <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#e9c349]">Детальніше про авто</div>}
                  </div>
                  {item.carId && <ArrowRight className="shrink-0 text-white" size={22} />}
                </div>
              </div>
            );
            
            return item.carId ? (
              <Link href={`/cars/${item.carId}`} key={index} className="block">
                {innerContent}
              </Link>
            ) : (
              <div key={index}>{innerContent}</div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
