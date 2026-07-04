'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, CarFront, MapPin, Percent, Plus, Power, Route, Tag, Trash2 } from 'lucide-react';

type Promo = {
  id: string;
  title: string;
  routeFrom?: string | null;
  routeTo?: string | null;
  discount: number;
  dateStart?: string | null;
  active: boolean;
  source?: string;
  distanceKm?: number;
  originalPrice?: number;
  discountedPrice?: number;
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

  const patchPromo = async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/promotions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchData();
  };

  const deletePromo = async (promo: Promo) => {
    const isAuto = promo.source === 'AUTO_EMPTY';
    const message = isAuto
      ? 'Приховати цю авто-акцію з сайту? Її можна буде повернути, увімкнувши знову.'
      : 'Видалити цю акцію?';
    if (!confirm(message)) return;
    await fetch(`/api/promotions/${promo.id}`, { method: 'DELETE' });
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
            «Авто-рейси» створюються автоматично для забронькованих авто, що вертаються додому порожні (знижка росте ближче до дати: 30/40/50%). «Ручні» — додаєш сам зліва. Будь-яку акцію можна вимкнути, змінити % або приховати.
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
            {promos.map((promo) => {
              const isAuto = promo.source === 'AUTO_EMPTY';
              return (
              <article key={promo.id} className="rounded-xl border border-white/10 bg-[#080818] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-3 py-1 text-xs font-bold text-[#e9c349]">
                        <Percent size={14} /> -{Number(promo.discount || 0)}%
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${isAuto ? 'border border-sky-400/25 bg-sky-400/10 text-sky-300' : 'border border-white/15 bg-white/5 text-[#c7c6ca]'}`}>
                        {isAuto ? 'Авто-рейс' : 'Ручна'}
                      </span>
                    </div>
                    <h3 className="m-0 text-lg font-bold text-white">{promo.title}</h3>
                    <div className="mt-3 grid gap-2 text-sm text-[#c7c6ca]">
                      <div className="flex items-center gap-2"><Route size={15} className="text-[#e9c349]" /> {promo.routeFrom || 'Будь-яке місто'} {'->'} {promo.routeTo || 'Будь-яке місто'}{promo.distanceKm ? ` • ${Math.round(promo.distanceKm)} км` : ''}</div>
                      <div className="flex items-center gap-2"><CarFront size={15} className="text-[#e9c349]" /> {promo.car ? `${promo.car.make} ${promo.car.model}` : 'Будь-який відповідний автомобіль'}</div>
                      <div className="flex items-center gap-2"><CalendarDays size={15} className="text-[#e9c349]" /> {promo.dateStart ? new Date(promo.dateStart).toLocaleDateString('uk-UA') : 'Без дати'}</div>
                      {isAuto && (promo.originalPrice || promo.discountedPrice) && (
                        <div className="flex items-center gap-2 text-[#c7c6ca]">
                          <Tag size={15} className="text-[#e9c349]" />
                          {promo.originalPrice ? <span className="text-[#8a8a93] line-through">€{promo.originalPrice}</span> : null}
                          {promo.discountedPrice ? <span className="font-bold text-white">€{promo.discountedPrice}</span> : null}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 md:w-56">
                    <span className={`rounded-lg px-3 py-2 text-center text-sm font-bold ${promo.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>
                      {promo.active ? 'Активна' : 'Прихована'}
                    </span>
                    <label className="grid gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Знижка, %</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        defaultValue={Number(promo.discount || 0)}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isFinite(value) && value !== Number(promo.discount || 0)) {
                            patchPromo(promo.id, { discount: value });
                          }
                        }}
                        className={fieldClass()}
                      />
                      {isAuto && <span className="text-[10px] leading-4 text-[#6f6f78]">Порожньо = автоматична знижка за часом (30/40/50%).</span>}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => patchPromo(promo.id, { active: !promo.active })}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-white/15 px-2 text-xs font-bold text-white hover:bg-white/5"
                      >
                        <Power size={14} /> {promo.active ? 'Вимкнути' : 'Увімкнути'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePromo(promo)}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-red-400/30 px-2 text-xs font-bold text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 size={14} /> {isAuto ? 'Приховати' : 'Видалити'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              );
            })}

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
