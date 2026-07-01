import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import Calculator from '../components/Calculator';
import ContactForm from '../components/ContactForm';
import GlobalGallery from '../components/GlobalGallery';
import NavAuth from '../components/NavAuth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const parseAccent = (text: string | undefined, defaultText: string) => {
  const t = text || defaultText;
  if (!t) return '';
  return t.replace(/\*(.*?)\*/g, '<span class="text-[#e9c349] font-bold">$1</span>');
};

export default async function Home() {
  const cars = await prisma.car.findMany({
    where: { status: 'AVAILABLE' }
  });
  
  const contentRows = await prisma.siteContent.findMany();
  const c = contentRows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  // Zbirayemo media z usih avto dlya golovnoi galerei
  const allMedia: { type: 'image' | 'video', url: string }[] = [];
  cars.forEach(car => {
    car.images.forEach(img => allMedia.push({ type: 'image', url: img }));
    car.videos.forEach(vid => allMedia.push({ type: 'video', url: vid }));
  });

  return (
    <div className="bg-[#080818] text-[#e4e2e3] font-body-md antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[24px] md:px-[64px] py-[12px] max-w-[1280px] mx-auto bg-[#080818]/90 backdrop-blur-md border-b border-white/10">
        
        {/* LOGO SLOT */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.png" alt={c['brand_name'] || 'First Line Transfer'} className="h-[40px] md:h-[50px] object-contain" />
        </Link>

        <div className="hidden md:flex gap-[32px] items-center">
          <Link href="#services" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">{c['menu_services'] || 'Послуги'}</Link>
          <Link href="#fleet" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">{c['menu_fleet'] || 'Автопарк'}</Link>
          <Link href="#gallery" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">{c['menu_gallery'] || 'Галерея'}</Link>
          <Link href="#contact" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">{c['menu_contact'] || 'Контакти'}</Link>
          <NavAuth loginText={c['menu_login'] || 'Увійти'} />
        </div>
        <div className="flex items-center gap-4">
          <Link href="#calculator" className="hidden md:block gold-button text-[12px] uppercase px-4 py-2 rounded-lg font-bold">
            {c['btn_book_now'] || 'Бронювати'}
          </Link>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[100vh] min-h-[700px] flex items-center justify-center px-[24px] md:px-[64px] mb-[80px]">
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            {c['hero_bg_video'] ? (
              <video src={c['hero_bg_video']} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-105" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-cover bg-center scale-105" style={{ backgroundImage: `url(${c['hero_bg_image'] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'})` }}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#080818]/80 via-[#080818]/60 to-[#080818] z-10"></div>
          </div>
          
          <div className="relative z-20 max-w-4xl text-center flex flex-col items-center pt-20">
            <h1 className="font-display-lg text-[48px] md:text-[80px] text-white mb-6 drop-shadow-2xl leading-[1.1]" dangerouslySetInnerHTML={{__html: c['hero_title'] || 'ПРЕМІУМ ТРАНСФЕР<br/><span style="color: #e9c349">БЕЗ КОМПРОМІСІВ</span>'}}></h1>
            <p className="font-body-lg text-[18px] md:text-[22px] text-[#c7c6ca] mb-10 max-w-2xl drop-shadow-md" dangerouslySetInnerHTML={{ __html: parseAccent(c['hero_subtitle'], 'Ваш час. Ваші правила. Ідеальний сервіс від дверей до дверей з гарантованою пунктуальністю.') }}></p>
            <Link href="#calculator" className="gold-button font-button text-[16px] uppercase px-10 py-5 rounded-xl font-bold tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-all">
              {c['btn_hero_cta'] || 'Розрахувати вартість'}
            </Link>
          </div>
        </section>

        {/* Services Section */}
        <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[100px]" id="services">
          <h2 className="font-headline-lg text-[40px] md:text-[56px] text-[#e4e2e3] mb-[64px] text-center" dangerouslySetInnerHTML={{ __html: parseAccent(c['services_title'], 'Чому обирають нас?') }}></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] mb-[64px]">
            {[1, 2, 3, 4].map((i) => {
              const defaults = [
                { t: 'Пунктуальність', d: 'Ми завжди прибуваємо за 15 хвилин до вказаного часу.', i: 'schedule' },
                { t: 'Преміум Автопарк', d: 'Тільки нові автомобілі в ідеальному технічному стані.', i: 'directions_car' },
                { t: 'Конфіденційність', d: 'Повна гарантія анонімності та безпеки ваших поїздок.', i: 'verified_user' },
                { t: 'Професійні Водії', d: 'Англомовні водії з багаторічним досвідом VIP-обслуговування.', i: 'workspace_premium' }
              ];
              return (
              <div key={i} className="glass-panel p-8 rounded-2xl hover-gold-border transition-all duration-300 flex flex-col items-start group">
                <span className="material-symbols-outlined text-[#e9c349] text-5xl mb-6 group-hover:scale-110 transition-transform">{c[`feature_${i}_icon`] || defaults[i-1].i}</span>
                <h3 className="font-headline-md text-2xl text-[#e4e2e3] mb-4" dangerouslySetInnerHTML={{ __html: parseAccent(c[`feature_${i}_title`], defaults[i-1].t) }}></h3>
                <p className="font-body-md text-[#c7c6ca] leading-relaxed" dangerouslySetInnerHTML={{ __html: parseAccent(c[`feature_${i}_desc`], defaults[i-1].d) }}></p>
              </div>
            )})}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
            <div className="glass-panel p-8 rounded-2xl border border-white/10">
              <h3 className="font-headline-md text-2xl text-[#e4e2e3] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e9c349]">local_cafe</span>
                <span dangerouslySetInnerHTML={{ __html: parseAccent(c['comforts_title'], 'Для комфортної поїздки наші авто забезпечені:') }}></span>
              </h3>
              <ul className="space-y-3">
                {(c['comforts_list'] ? JSON.parse(c['comforts_list']) : [
                  'водою', 'пледами', 'подушками', 'вологими та сухими серветками',
                  'зарядними пристроями та кабелями для різних типів телефонів'
                ]).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-[#c7c6ca]">
                    <span className="material-symbols-outlined text-[#e9c349] text-xl shrink-0 mt-0.5">check_circle</span>
                    <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseAccent(item, '') }}></span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-[#e9c349]/5">
              <h3 className="font-headline-md text-2xl text-[#e4e2e3] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e9c349]">star</span>
                <span dangerouslySetInnerHTML={{ __html: parseAccent(c['advantages_title'], 'Наші переваги:') }}></span>
              </h3>
              <ul className="space-y-3">
                {(c['advantages_list'] ? JSON.parse(c['advantages_list']) : [
                  'завжди чисті та доглянуті авто', 'уважні та досвідчені водії', 'знижка 10% на першу поїздку'
                ]).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-[#c7c6ca]">
                    <span className="material-symbols-outlined text-[#e9c349] text-xl shrink-0 mt-0.5">done</span>
                    <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseAccent(item, '') }}></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Global Gallery Section */}
        <section className="w-full mb-[100px] overflow-hidden" id="gallery">
          <div className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[48px]">
            <h2 className="font-headline-lg text-[40px] md:text-[56px] text-[#e4e2e3] text-center" dangerouslySetInnerHTML={{ __html: parseAccent(c['gallery_title'], 'Галерея') }}></h2>
            <p className="text-center text-[#c7c6ca] mt-4 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: parseAccent(c['gallery_subtitle'], 'Наш автопарк в реальному житті. Відео та фото преміум-якості.') }}></p>
          </div>
          <GlobalGallery media={allMedia.length > 0 ? allMedia : [
            { type: 'image', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80' }
          ]} />
        </section>

        {/* Fleet Section */}
        <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[100px]" id="fleet">
          <h2 className="font-headline-lg text-[40px] md:text-[56px] text-[#e4e2e3] mb-[64px] text-center" dangerouslySetInnerHTML={{ __html: parseAccent(c['fleet_title'], 'Оберіть свій клас') }}></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[40px]">
            {cars.map(car => (
              <div key={car.id} className="glass-panel rounded-3xl overflow-hidden hover-gold-border transition-all duration-300 group flex flex-col relative border border-white/10">
                <Link href={`/cars/${car.id}`} className="block h-72 relative overflow-hidden bg-[#1b1b1c]">
                  {car.images[0] ? (
                    <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-[#46474a] text-6xl">directions_car</span></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080818] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                    <div>
                      <h3 className="font-headline-md text-3xl text-white mb-1">{car.make}</h3>
                      <p className="text-[#c7c6ca] font-bold">{car.model}</p>
                    </div>
                  </div>
                </Link>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6 py-4 border-y border-white/10">
                    <div className="text-center">
                      <div className="text-[#e9c349] font-bold text-xl">{car.year}</div>
                      <div className="text-[11px] text-[#c7c6ca] uppercase tracking-widest mt-1">Рік</div>
                    </div>
                    <div className="text-center border-l border-white/10 pl-6">
                      <div className="text-white font-bold text-xl flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[18px]">person</span> {car.capacity}</div>
                      <div className="text-[11px] text-[#c7c6ca] uppercase tracking-widest mt-1">Місць</div>
                    </div>
                    <div className="text-center border-l border-white/10 pl-6">
                      <div className="text-white font-bold text-xl">€{car.baseRate}</div>
                      <div className="text-[11px] text-[#c7c6ca] uppercase tracking-widest mt-1">За км</div>
                    </div>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <Link href={`/cars/${car.id}`} className="ghost-button font-button text-[14px] uppercase px-4 py-3 rounded-lg text-center font-bold">
                      Детальніше
                    </Link>
                    <Link href={`/?carId=${car.id}#calculator`} className="gold-button font-button text-[14px] uppercase px-4 py-3 rounded-lg text-center font-bold">
                      Бронювати
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator Section */}
        <Calculator cars={cars} cmsSettings={c} />

        <ContactForm />
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
              <span className="font-display-lg text-white/70 text-[20px]">{c['brand_name'] || 'First Line Transfer'}</span>
            </div>
            <p className="text-[#c7c6ca]/70 text-sm">{c['footer_text'] || 'Преміальні трансфери Європою та Україною. Комфорт, безпека та конфіденційність.'}</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Меню</h4>
            <div className="flex flex-col gap-3 text-[#c7c6ca]/70 text-sm">
              <Link href="#services" className="hover:text-[#e9c349] transition-colors">{c['menu_services'] || 'Послуги'}</Link>
              <Link href="#fleet" className="hover:text-[#e9c349] transition-colors">{c['menu_fleet'] || 'Автопарк'}</Link>
              <Link href="#calculator" className="hover:text-[#e9c349] transition-colors">{c['menu_calculator'] || 'Бронювання'}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Контакти</h4>
            <div className="flex flex-col gap-3 text-[#c7c6ca]/70 text-sm">
              <a href={`tel:${c['contact_phone']}`} className="hover:text-[#e9c349] transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">call</span> {c['contact_phone'] || '+380 00 000 00 00'}</a>
              <a href={`mailto:${c['contact_email']}`} className="hover:text-[#e9c349] transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">mail</span> {c['contact_email'] || 'info@firstline.com'}</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-16 pt-8 border-t border-white/5 text-center text-[#c7c6ca]/50 text-xs">
          © {new Date().getFullYear()} {c['brand_name'] || 'First Line Transfer'}. Всі права захищено.
        </div>
      </footer>
    </div>
  );
}
