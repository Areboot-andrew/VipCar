'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export default function GlobalGallery({ media }: { media: { type: 'image' | 'video', url: string }[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'center', dragFree: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false })
  ]);

  if (!media || media.length === 0) {
    return null; // Fallback if no media
  }

  return (
    <div className="embla overflow-hidden w-full cursor-grab active:cursor-grabbing" ref={emblaRef}>
      <div className="embla__container flex gap-6">
        {media.map((item, index) => (
          <div className="embla__slide flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0 relative rounded-2xl overflow-hidden group h-[300px] md:h-[400px]" key={index}>
            {item.type === 'video' ? (
              <video 
                src={item.url} 
                autoPlay loop muted playsInline 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <img 
                src={item.url} 
                alt={`Gallery item ${index}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
            )}
            {/* Overlay gradient for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080818] via-transparent to-transparent opacity-80"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
