'use client';

import { motion } from "framer-motion";
import { useState } from "react";

interface MarqueeGalleryProps {
  media: { type: 'image' | 'video', url: string }[];
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
        className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-8 md:mb-16 text-center"
      >
        <span className="text-[#e9c349] font-label-caps tracking-widest uppercase mb-4 block">Галерея</span>
        {title && (
          <h2 className="font-headline-lg text-[40px] md:text-[56px] text-white" dangerouslySetInnerHTML={{ __html: title }}></h2>
        )}
        {subtitle && (
          <p className="text-[#c7c6ca] mt-4 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: subtitle }}></p>
        )}
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
          {marqueeItems.map((item, index) => (
            <div
              key={index}
              className="group relative w-[280px] md:w-[450px] aspect-[4/3] rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 bg-[#1b1b1c] cursor-pointer"
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
                  alt="Gallery Item"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              )}
              {/* Optional Glassmorphism overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
