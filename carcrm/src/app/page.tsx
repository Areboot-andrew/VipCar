import React, { Suspense } from 'react';
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import Calculator from '../components/Calculator';
import ContactForm from '../components/ContactForm';
import MarqueeGallery from '../components/MarqueeGallery';
import NavAuth from '../components/NavAuth';
import MobileMenu from '../components/MobileMenu';
import EmptyLegsBanner from '../components/EmptyLegsBanner';
import HighlightedTitle from '../components/ui/HighlightedTitle';
import DynamicIcon from '../components/ui/DynamicIcon';
import { withContentDefaults } from '../lib/contentDefaults';

export const dynamic = 'force-dynamic';

const parseAccent = (text: string | undefined, defaultText: string = '') => {
  const t = text || defaultText;
  if (!t) return '';
  return t.replace(/\*(.*?)\*/g, '<span class="text-[#e9c349] font-bold">$1</span>');
};

const toHighlightedText = (text: string | undefined, defaultText: string = '') => {
  const t = text || defaultText;
  if (!t) return '';

  return t
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<span[^>]*>(.*?)<\/span>/gi, '*$1*')
    .replace(/<[^>]+>/g, '');
};

export default async function Home() {
  const cars = await prisma.car.findMany({
    where: { status: 'AVAILABLE' },
    include: {
      media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
      defaultDriver: true,
    },
  });
  
  const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });

  const globalFuelPrices = await prisma.fuelPrice.findMany();
  
  const contentRows = await prisma.siteContent.findMany();
  const c = withContentDefaults(contentRows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>));

  const blocks = await prisma.pageBlock.findMany({
    where: { active: true },
    orderBy: { order: 'asc' }
  });

  // Fallback Media for Gallery if no blocks exist
  const allMedia: { type: 'image' | 'video', url: string, carId?: string, title?: string, alt?: string }[] = [];
  if (c.standalone_gallery_media) {
    try { allMedia.push(...JSON.parse(c.standalone_gallery_media)); } catch (e) {}
  }
  cars.forEach(car => {
    if (car.media.length > 0) {
      car.media.forEach(item => allMedia.push({ type: item.type === 'video' ? 'video' : 'image', url: item.url, carId: car.slug || car.id, title: `${car.make} ${car.model}`, alt: item.alt || `${car.make} ${car.model}` }));
      return;
    }
    car.images.forEach(img => allMedia.push({ type: 'image', url: img, carId: car.slug || car.id, title: `${car.make} ${car.model}`, alt: `${car.make} ${car.model}` }));
    car.videos.forEach(vid => allMedia.push({ type: 'video', url: vid, carId: car.slug || car.id, title: `${car.make} ${car.model}`, alt: `${car.make} ${car.model} video` }));
  });

  return (
    <div className="bg-[#080818] text-[#e4e2e3] font-body-md antialiased min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#080818]/90 backdrop-blur-md border-b border-white/10">
        <nav className="flex justify-between items-center px-[24px] md:px-[64px] py-[12px] max-w-[1280px] mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 cursor-pointer flex-1">
            <img src={c['logo_url']} alt={c['brand_name']} className="h-[40px] md:h-[50px] object-contain" />
          </Link>
          <div className="hidden md:flex flex-none gap-[32px] items-center justify-center">
            <Link href="#services" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">{c['menu_services']}</Link>
            <Link href="/gallery" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">{c['menu_gallery']}</Link>
            <Link href="#contact" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">{c['menu_contact']}</Link>
            <NavAuth loginText={c['menu_login']} driverCabinetText={c['menu_driver_cabinet']} profileText={c['menu_profile']} logoutText={c['menu_logout']} />
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <Link href="#calculator" className="hidden md:block gold-button text-[12px] uppercase px-6 py-2.5 rounded-xl font-bold tracking-wider">
              {c['btn_book_now']}
            </Link>
            <MobileMenu c={c} />
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-16">
        
        {blocks.length > 0 ? (
          // DYNAMIC BLOCKS RENDERING
          <div className="flex flex-col gap-16">
            {blocks.map(block => {
              let parsed = {} as any;
              try { parsed = JSON.parse(block.content); } catch (e) {}

              if (block.type === 'HERO') {
                return (
                  <section key={block.id} className="relative w-full h-[100vh] min-h-[700px] flex items-center justify-center px-[24px] md:px-[64px] -mt-16 mb-16">
                    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                      {parsed.bgImage && parsed.bgImage.includes('.mp4') ? (
                        <video src={parsed.bgImage} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-105" />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-cover bg-center scale-105" style={{ backgroundImage: `url(${parsed.bgImage || c['hero_bg_image'] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'})` }}></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#080818]/80 via-[#080818]/60 to-[#080818] z-10"></div>
                    </div>
                    <div className="relative z-20 max-w-4xl text-center flex flex-col items-center pt-20 px-4">
                      <HighlightedTitle text={toHighlightedText(parsed.title || c['hero_title'])} as="h1" className="font-display-lg text-[36px] md:text-[80px] text-white mb-6 drop-shadow-2xl leading-[1.2] md:leading-[1.1]" />
                      <p className="font-body-lg text-[16px] md:text-[22px] text-[#c7c6ca] mb-10 max-w-2xl drop-shadow-md" dangerouslySetInnerHTML={{ __html: parseAccent(parsed.subtitle || c['hero_subtitle']) }}></p>
                      <Link href="#calculator" className="gold-button font-button text-[14px] md:text-[16px] uppercase px-6 py-4 md:px-10 md:py-5 rounded-xl font-bold tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-all w-full md:w-auto">
                        {c['btn_hero_cta']}
                      </Link>
                    </div>
                  </section>
                );
              }

              if (block.type === 'TEXT_IMAGE') {
                return (
                  <section key={block.id} className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] my-16">
                    <div className={`flex flex-col gap-12 items-center ${parsed.imagePosition === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      <div className="flex-1 space-y-6">
                        <HighlightedTitle text={toHighlightedText(parsed.title)} as="h2" className="font-headline-lg text-4xl text-[#e4e2e3]" />
                        <div className="rich-content" dangerouslySetInnerHTML={{__html: parsed.text || ''}}></div>
                      </div>
                      {parsed.image && (
                        <div className="flex-1">
                          <img src={parsed.image} alt={parsed.title} className="w-full rounded-2xl shadow-2xl border border-white/5" />
                        </div>
                      )}
                    </div>
                  </section>
                );
              }

              if (block.type === 'INFO') {
                const items: any[] = Array.isArray(parsed.items) ? parsed.items : [];
                return (
                  <section key={block.id} className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] my-20">
                    {parsed.title && (
                      <div className="mb-12 text-center">
                        <HighlightedTitle text={toHighlightedText(parsed.title)} as="h2" className="font-headline-lg text-3xl md:text-[42px] leading-tight text-white" />
                        <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#e9c349]"></div>
                        {parsed.subtitle && <p className="mx-auto mt-4 max-w-2xl text-[#c7c6ca]" dangerouslySetInnerHTML={{ __html: parseAccent(parsed.subtitle) }}></p>}
                      </div>
                    )}
                    <div className="flex flex-col gap-14 md:gap-20">
                      {items.map((item: any, i: number) => {
                        const hasImage = Boolean(item.image);
                        const isVideo = hasImage && (item.image.includes('.mp4') || item.image.includes('.webm'));
                        return (
                          <div key={i} className={`flex flex-col items-center gap-8 md:gap-14 ${hasImage ? (i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row') : ''}`}>
                            <div className={hasImage ? 'flex-1 min-w-0' : 'max-w-3xl mx-auto text-center'}>
                              {item.title && <h3 className="font-headline-md text-2xl md:text-3xl text-white mb-4">{item.title}</h3>}
                              <div className="rich-content" dangerouslySetInnerHTML={{ __html: item.text || '' }}></div>
                            </div>
                            {hasImage && (
                              <div className="flex-1 min-w-0 w-full">
                                <div className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                                  {isVideo ? (
                                    <video src={item.image} autoPlay loop muted playsInline className="aspect-[4/3] w-full object-cover" />
                                  ) : (
                                    <img src={item.image} alt={item.title || 'Інформація'} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  )}
                                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#e9c349]/10"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              if (block.type === 'GALLERY') {
                const galleryMedia = (parsed.items || []).map((url: string) => ({ type: url.includes('.mp4') ? 'video' : 'image', url }));
                return (
                  <div key={block.id}>
                    <MarqueeGallery media={galleryMedia.length > 0 ? galleryMedia : allMedia} title={parsed.title} subtitle={parsed.subtitle || c['gallery_subtitle']} />
                  </div>
                );
              }

              if (block.type === 'CTA') {
                return (
                  <section key={block.id} className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] my-16 w-full">
                    <div className="relative overflow-hidden rounded-3xl border border-[#e9c349]/25 bg-gradient-to-r from-[#13131a] to-[#1c1c28] p-10 text-center md:p-16">
                      {parsed.bgImage && (
                        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${parsed.bgImage})` }}></div>
                      )}
                      <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-[#e9c349]/10 blur-3xl"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <HighlightedTitle text={toHighlightedText(parsed.title)} as="h2" className="font-headline-lg text-3xl md:text-5xl text-white mb-4" />
                        {parsed.subtitle && <p className="mb-8 max-w-2xl text-[16px] md:text-lg text-[#c7c6ca]">{parsed.subtitle}</p>}
                        <Link href={parsed.buttonLink || '#calculator'} className="gold-button font-button text-[14px] uppercase px-8 py-4 rounded-xl font-bold tracking-widest hover:scale-105 transition-all">
                          {parsed.buttonText || 'Розрахувати поїздку'}
                        </Link>
                      </div>
                    </div>
                  </section>
                );
              }

              if (block.type === 'FEATURES') {
                return (
                  <section key={block.id} className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] my-16" id="services">
                    <HighlightedTitle text={toHighlightedText(parsed.title)} as="h2" className="font-headline-lg text-4xl text-center text-[#e4e2e3] mb-12" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {(parsed.items || []).map((feat: any, idx: number) => (
                        <div key={idx} className="glass-panel p-8 rounded-2xl hover-gold-border transition-all flex flex-col items-start group">
                           <DynamicIcon name={feat.icon || 'Star'} size={48} className="text-[#e9c349] mb-6 transition-transform group-hover:scale-110" />
                           <HighlightedTitle text={toHighlightedText(feat.title)} as="h3" className="font-headline-md text-2xl text-white mb-4" />
                           <p className="text-[#c7c6ca] leading-relaxed">{feat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              return null;
            })}
          </div>
        ) : (
          // FALLBACK FOR OLD CONFIGURATION
          <>
            <section className="relative w-full h-[100vh] min-h-[700px] flex items-center justify-center px-[24px] md:px-[64px] mb-[80px]">
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                {c['hero_bg_video'] ? (
                  <video src={c['hero_bg_video']} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-105" />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-cover bg-center scale-105" style={{ backgroundImage: `url(${c['hero_bg_image'] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'})` }}></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[#080818]/80 via-[#080818]/60 to-[#080818] z-10"></div>
              </div>
              <div className="relative z-20 max-w-4xl text-center flex flex-col items-center pt-20 px-4">
                <HighlightedTitle text={toHighlightedText(c['hero_title'])} as="h1" className="font-display-lg text-[36px] md:text-[80px] text-white mb-6 drop-shadow-2xl leading-[1.2] md:leading-[1.1]" />
                <p className="font-body-lg text-[16px] md:text-[22px] text-[#c7c6ca] mb-10 max-w-2xl drop-shadow-md" dangerouslySetInnerHTML={{ __html: parseAccent(c['hero_subtitle']) }}></p>
                <Link href="#calculator" className="gold-button font-button text-[14px] md:text-[16px] uppercase px-6 py-4 md:px-10 md:py-5 rounded-xl font-bold tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-all w-full md:w-auto">
                  {c['btn_hero_cta']}
                </Link>
              </div>
            </section>

            <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[100px]" id="services">
              <HighlightedTitle text={toHighlightedText(c['services_title'])} as="h2" className="font-headline-lg text-[40px] md:text-[56px] text-[#e4e2e3] mb-[64px] text-center" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] mb-[64px]">
                {[1, 2, 3, 4].map((i) => {
                  return (
                  <div key={i} className="glass-panel p-8 rounded-2xl hover-gold-border transition-all duration-300 flex flex-col items-start group">
                    <DynamicIcon name={c[`feature_${i}_icon`]} size={48} className="text-[#e9c349] mb-6 group-hover:scale-110 transition-transform" />
                    <HighlightedTitle text={toHighlightedText(c[`feature_${i}_title`])} as="h3" className="font-headline-md text-2xl text-[#e4e2e3] mb-4" />
                    <p className="font-body-md text-[#c7c6ca] leading-relaxed" dangerouslySetInnerHTML={{ __html: parseAccent(c[`feature_${i}_desc`]) }}></p>
                  </div>
                )})}
              </div>
            </section>
            
            <MarqueeGallery media={allMedia.length > 0 ? allMedia : [
              { type: 'image', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80' }
            ]} title={parseAccent(c['gallery_title'])} subtitle={c['gallery_subtitle']} />
          </>
        )}

        <EmptyLegsBanner cmsSettings={c} />

        <div id="calculator" className="scroll-mt-24">
          <Suspense fallback={<div className="text-center text-[#e9c349] py-12">{c['loading_calculator']}</div>}>
            <Calculator cars={cars} cmsSettings={c} siteSettings={siteSettings} globalFuelPrices={globalFuelPrices} />
          </Suspense>
        </div>

        <div id="contact" className="scroll-mt-24">
           <ContactForm cmsSettings={c} />
        </div>
      </main>

      <footer className="w-full py-[64px] px-[24px] md:px-[64px] bg-[#0a0a0a] border-t border-white/5 mt-auto">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              {c['logo_url'] ? (
                <img src={c['logo_url']} alt="Logo" className="h-8 w-auto object-contain grayscale opacity-70" />
              ) : (
                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-white/50 text-xs">FLT</div>
              )}
              <span className="font-display-lg text-white/70 text-[20px]">{c['brand_name']}</span>
            </div>
            <p className="text-[#c7c6ca]/70 text-sm">{c['footer_text']}</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">{c['footer_menu_title']}</h4>
            <div className="flex flex-col gap-3 text-[#c7c6ca]/70 text-sm">
              <Link href="#services" className="hover:text-[#e9c349] transition-colors">{c['menu_services']}</Link>
              <Link href="/gallery" className="hover:text-[#e9c349] transition-colors">{c['menu_gallery']}</Link>
              <Link href="#calculator" className="hover:text-[#e9c349] transition-colors">{c['menu_calculator']}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">{c['footer_contacts_title']}</h4>
            <div className="flex flex-col gap-3 text-[#c7c6ca]/70 text-sm">
              <a href={`tel:${c['contact_phone']}`} className="hover:text-[#e9c349] transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">call</span> {c['contact_phone']}</a>
              <a href={`mailto:${c['contact_email']}`} className="hover:text-[#e9c349] transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">mail</span> {c['contact_email']}</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-16 pt-8 border-t border-white/5 text-center text-[#c7c6ca]/50 text-xs">
          © {new Date().getFullYear()} {c['brand_name']}. {c['footer_rights']}
        </div>
      </footer>
    </div>
  );
}
