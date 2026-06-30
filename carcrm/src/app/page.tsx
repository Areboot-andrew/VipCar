import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import Calculator from '../components/Calculator';
import ContactForm from '../components/ContactForm';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cars = await prisma.car.findMany({
    where: { status: 'AVAILABLE' }
  });
  
  const contentRows = await prisma.siteContent.findMany();
  const c = contentRows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="bg-[#131314] text-[#e4e2e3] font-body-md antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[24px] md:px-[64px] py-[8px] max-w-[1280px] mx-auto bg-[#131314]/90 backdrop-blur-md border-b border-white/10">
        <div className="font-display-lg text-[#e4e2e3] text-[32px] cursor-pointer hover:text-white/80 transition-colors">
          {c['hero_title']?.split(' ')[0] || 'First'} {c['hero_title']?.split(' ')[1] || 'Line'} Transfer
        </div>
        <div className="hidden md:flex gap-[32px] items-center">
          <Link href="#services" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">Послуги</Link>
          <Link href="#fleet" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">Автопарк</Link>
          <Link href="#calculator" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">Бронювання</Link>
          <Link href="#contact" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">Контакти</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hidden md:block text-[#e4e2e3] hover:text-[#e9c349] font-label-caps text-[12px] uppercase border border-white/20 px-4 py-2 rounded-lg">
            Увійти (Адмін)
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="relative w-full h-[819px] min-h-[600px] flex items-center justify-center px-[24px] md:px-[64px] mb-[80px]">
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-[#131314]/50 to-transparent z-10"></div>
          </div>
          <div className="relative z-10 max-w-3xl text-center flex flex-col items-center">
            <h1 className="font-display-lg text-[40px] md:text-[64px] text-[#e4e2e3] mb-6 drop-shadow-lg leading-tight" dangerouslySetInnerHTML={{__html: c['hero_title'] || 'First Line Transfer —<br/>Ваш час. Ваші правила.'}}></h1>
            <p className="font-body-lg text-[18px] text-[#c7c6ca] mb-10 max-w-2xl">
              {c['hero_subtitle'] || 'Преміум-трансфер від дверей до дверей з гарантованою пунктуальністю та абсолютною конфіденційністю.'}
            </p>
            <Link href="#calculator" className="gold-button font-button text-[14px] uppercase px-8 py-4 rounded-lg">
              Забронювати поїздку
            </Link>
          </div>
        </section>

        {/* Services Section */}
        <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[80px]" id="services">
          <h2 className="font-headline-lg text-[48px] text-[#e4e2e3] mb-[48px] text-center">Чому ми?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px]">
            {[1, 2, 3, 4].map((i) => {
              const defaults = [
                { t: 'Пунктуальність 10/10', d: 'Ми цінуємо ваш час.' },
                { t: 'Турбота з першої секунди', d: 'Допомога з багажем.' },
                { t: 'Гнучкість', d: 'Підлаштовуємося під ваш графік.' },
                { t: 'Абсолютна конфіденційність', d: 'Ваш простір недоторканний.' }
              ];
              return (
              <div key={i} className="glass-panel p-8 rounded-xl hover-gold-border transition-colors duration-300 flex flex-col items-start group">
                <span className="material-symbols-outlined text-[#ffe088] text-4xl mb-6 group-hover:scale-110 transition-transform">star</span>
                <h3 className="font-headline-md text-xl text-[#e4e2e3] mb-4">{c[`feature_${i}_title`] || defaults[i-1].t}</h3>
                <p className="font-body-md text-[#c7c6ca]">{c[`feature_${i}_desc`] || defaults[i-1].d}</p>
              </div>
            )})}
          </div>
        </section>

        {/* Calculator Section */}
        <Calculator cars={cars} />

        {/* Fleet Section */}
        <section className="max-w-[1280px] mx-auto px-[24px] md:px-[64px] mb-[80px]" id="fleet">
          <h2 className="font-headline-lg text-[48px] text-[#e4e2e3] mb-[48px] text-center">Наш автопарк</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
            {cars.map(car => (
              <div key={car.id} className="glass-panel rounded-xl overflow-hidden hover-gold-border transition-colors duration-300 group flex flex-col">
                <div className="h-64 bg-[#1b1b1c] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#46474a] text-6xl">directions_car</span>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-headline-md text-2xl text-[#e4e2e3] mb-2">{car.make} {car.model}</h3>
                  <p className="font-body-md text-[#c7c6ca] mb-6">Рік випуску: {car.year}. Базова ставка: €{car.baseRate}/км</p>
                  <button className="ghost-button w-full font-button text-[14px] uppercase px-6 py-3 rounded mt-auto">
                    Обрати авто
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ContactForm />
      </main>

      <footer className="w-full py-[48px] px-[24px] md:px-[64px] max-w-[1280px] mx-auto border-t border-white/5 mt-auto">
        <div className="font-headline-md text-[#e4e2e3] mb-2">First Line Transfer</div>
        <p className="font-body-md text-[#ffe088] mb-4">© 2024 First Line Transfer. The First Class of the Road.</p>
      </footer>
    </div>
  );
}
