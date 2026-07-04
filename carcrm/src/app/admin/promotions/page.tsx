'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, CarFront, MapPin, Percent, Plus, Route, Tag } from 'lucide-react';

type Promo = {
  id: string;
  title: string;
  routeFrom?: string | null;
  routeTo?: string | null;
  discount: number;
  dateStart?: string | null;
  active: boolean;
  car?: {
    make: string;
    model: string;
    year?: number | null;
  } | null;
};

type CarOption = {
  id: string;
  make: string;
  model: string;
  year?: number | null;
};

function fieldClass() {
  return 'h-11 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#56565f] focus:border-[#e9c349]/60';
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">{label}</span>
      {children}
      <span className="text-xs leading-5 text-[#6f6f78]">{hint}</span>
    </label>
  );
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [discount, setDiscount] = useState('');
  const [carId, setCarId] = useState('');
  const [dateStart, setDateStart] = useState('');

  const fetchData = async () => {
    try {
      const [promosRes, carsRes] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/cars'),
      ]);
      const promosData = await promosRes.json();
      const carsData = await carsRes.json();

      setPromos(Array.isArray(promosData) ? promosData : []);
      setCars(Array.isArray(carsData) ? carsData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, routeFrom, routeTo, discount, carId, dateStart }),
    });
    setTitle('');
    setRouteFrom('');
    setRouteTo('');
    setDiscount('');
    setCarId('');
    setDateStart('');
    setSaving(false);
    fetchData();
  };

  if (loading) {
    return <div className="p-8 text-white">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen text-[#e4e2e3]">
      <div className="mb-6 flex items-start gap-3 border-b border-white/10 pb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
          <Tag size={22} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Empty Legs</h1>
          <p className="m-0 mt-1 max-w-3xl text-sm leading-6 text-[#8a8a93]">
            Знижки на порожні або планові рейси. Тут задаємо зрозумілу назву, маршрут, дату, опціональне авто і відсоток знижки для клієнта.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-xl border border-white/10 bg-[#13131a] p-5">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
            <Plus size={19} className="text-[#e9c349]" /> Нова пропозиція
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field label="Назва акції" hint="Короткий зрозумілий заголовок для менеджера і клієнта.">
              <input required value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass()} placeholder="Порожній рейс до Києва" />
            </Field>

            <Field label="Автомобіль" hint="Якщо авто не вибране, пропозиція може бути застосована до будь-якої відповідної машини.">
              <select value={carId} onChange={(event) => setCarId(event.target.value)} className={fieldClass()}>
                <option value="">Будь-який автомобіль</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model} {car.year ? `(${car.year})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Звідки" hint="Місто або точка старту порожнього рейсу.">
                <input required value={routeFrom} onChange={(event) => setRouteFrom(event.target.value)} className={fieldClass()} placeholder="Варшава" />
              </Field>
              <Field label="Куди" hint="Напрямок, куди авто має їхати або повертатись.">
                <input required value={routeTo} onChange={(event) => setRouteTo(event.target.value)} className={fieldClass()} placeholder="Київ" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Дата рейсу" hint="День, коли пропозиція доступна для бронювання.">
                <input required value={dateStart} onChange={(event) => setDateStart(event.target.value)} type="date" className={fieldClass()} />
              </Field>
              <Field label="Знижка, %" hint="Відсоток знижки від стандартної ціни маршруту.">
                <input required value={discount} onChange={(event) => setDiscount(event.target.value)} type="number" min="1" max="100" className={fieldClass()} placeholder="30" />
              </Field>
            </div>

            <button type="submit" disabled={saving} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-5 text-sm font-bold text-black transition-transform hover:scale-[1.01] disabled:opacity-60">
              <Plus size={17} /> {saving ? 'Збереження...' : 'Додати знижку'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-xl font-bold text-white">Активні пропозиції</h2>
              <p className="m-0 mt-1 text-sm text-[#8a8a93]">Список рейсів, які можна показати як вигідні напрямки.</p>
            </div>
            <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 px-3 py-2 text-sm font-bold text-[#e9c349]">
              {promos.length} шт.
            </div>
          </div>

          <div className="grid gap-3">
            {promos.map((promo) => (
              <article key={promo.id} className="rounded-xl border border-white/10 bg-[#080818] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-3 py-1 text-xs font-bold text-[#e9c349]">
                      <Percent size={14} /> -{Number(promo.discount || 0)}%
                    </div>
                    <h3 className="m-0 text-lg font-bold text-white">{promo.title}</h3>
                    <div className="mt-3 grid gap-2 text-sm text-[#c7c6ca]">
                      <div className="flex items-center gap-2"><Route size={15} className="text-[#e9c349]" /> {promo.routeFrom || 'Будь-яке місто'} {'->'} {promo.routeTo || 'Будь-яке місто'}</div>
                      <div className="flex items-center gap-2"><CarFront size={15} className="text-[#e9c349]" /> {promo.car ? `${promo.car.make} ${promo.car.model}` : 'Будь-який відповідний автомобіль'}</div>
                      <div className="flex items-center gap-2"><CalendarDays size={15} className="text-[#e9c349]" /> {promo.dateStart ? new Date(promo.dateStart).toLocaleDateString('uk-UA') : 'Без дати'}</div>
                    </div>
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm font-bold ${promo.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>
                    {promo.active ? 'Активна' : 'Неактивна'}
                  </div>
                </div>
              </article>
            ))}

            {promos.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#080818] p-8 text-center text-sm text-[#8a8a93]">
                <MapPin className="mx-auto mb-3 text-[#e9c349]" />
                Поки немає активних Empty Legs. Додай першу пропозицію зліва.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
