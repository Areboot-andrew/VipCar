import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import GlobalGallery from '../../../components/GlobalGallery';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const car = await prisma.car.findUnique({ where: { id: params.id } });
  if (!car) return { title: 'Авто не знайдено' };
  
  return {
    title: `Оренда ${car.make} ${car.model} | First Line Transfer`,
    description: `Преміум трансфер на ${car.make} ${car.model}. Місць: ${car.capacity}. Базова ставка: €${car.baseRate}/км. Бронюйте онлайн!`,
    openGraph: {
      title: `Оренда ${car.make} ${car.model}`,
      images: car.images.length > 0 ? [car.images[0]] : [],
    }
  };
}

export default async function CarDetailsPage({ params }: { params: { id: string } }) {
  const car = await prisma.car.findUnique({ where: { id: params.id } });
  
  if (!car) {
    return <div className="min-h-screen flex items-center justify-center bg-[#080818] text-white"><h1>Автомобіль не знайдено</h1></div>;
  }

  const allMedia: { type: 'image'|'video', url: string }[] = [];
  car.images.forEach(img => allMedia.push({ type: 'image', url: img }));
  car.videos.forEach(vid => allMedia.push({ type: 'video', url: vid }));

  return (
    <div className="bg-[#080818] text-[#e4e2e3] font-body-md antialiased min-h-screen flex flex-col pt-24">
      {/* NavBar (Simplified) */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-[#080818]/90 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="relative z-50 block">
          <img src="/logo.png" alt="First Line Transfer" className="h-[40px] md:h-[50px] object-contain" />
        </Link>
        <Link href="/" className="text-[#c7c6ca] hover:text-white flex items-center gap-2">
          <span className="material-symbols-outlined">arrow_back</span> На головну
        </Link>
      </nav>

      <main className="flex-grow max-w-[1280px] mx-auto w-full px-6 md:px-16 pb-24">
        
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="font-display-lg text-4xl md:text-6xl text-white mb-2">{car.make} {car.model}</h1>
            <div className="flex gap-4 text-[#c7c6ca] font-label-caps tracking-widest text-sm">
              <span>{car.year} Рік</span>
              <span>•</span>
              <span>Клас: Преміум</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#e9c349] font-bold text-3xl mb-4">€{car.baseRate} <span className="text-sm text-[#c7c6ca] font-normal">/ км</span></div>
            <Link href={`/?carId=${car.id}#calculator`} className="gold-button font-button text-[14px] uppercase px-12 py-4 rounded-xl font-bold tracking-widest shadow-[0_5px_20px_rgba(212,175,55,0.2)] hover:scale-105 transition-all inline-block">
              Забронювати
            </Link>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-16">
          <h2 className="font-headline-md text-2xl text-white mb-6">Галерея автомобіля</h2>
          {allMedia.length > 0 ? (
            <GlobalGallery media={allMedia} />
          ) : (
            <div className="w-full h-64 bg-[#1b1b1c] rounded-2xl flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-[#46474a] text-6xl">no_photography</span>
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-headline-md text-2xl text-white mb-6">Характеристики</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-[#c7c6ca]">Кількість місць</span>
                <span className="font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined">person</span> {car.capacity}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-[#c7c6ca]">Витрата пального</span>
                <span className="font-bold text-white">{car.fuelType} • {car.fuelConsumptionCity}/{car.fuelConsumptionHighway} л/100км</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="text-[#c7c6ca]">Статус</span>
                <span className="font-bold text-[#4ade80]">Доступний для бронювання</span>
              </div>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-[#e9c349]/20 flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-[#e9c349] text-5xl mb-4">workspace_premium</span>
            <h3 className="font-headline-md text-xl text-white mb-2">Преміальний сервіс</h3>
            <p className="text-[#c7c6ca] text-sm">
              Цей автомобіль подається виключно в ідеальному стані, після повної хімчистки та мийки, з англомовним водієм у діловому костюмі. Вода та Wi-Fi завжди в салоні.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
