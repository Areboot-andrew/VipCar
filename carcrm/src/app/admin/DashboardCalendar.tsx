'use client';

import React, { useMemo, useState } from 'react';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale/uk';
import { CalendarDays, Car as CarIcon, Clock, Euro, MapPin, User, Users } from 'lucide-react';

type Car = {
  id: string;
  make: string;
  model: string;
};

type Booking = {
  id: string;
  carId: string;
  driverId?: string | null;
  routeFrom: string;
  routeTo: string;
  distance: number;
  price: number;
  dateStart: string;
  dateEnd: string;
  desiredArrivalAt?: string | null;
  carDispatchAt?: string | null;
  deliveryDistance?: number | null;
  totalExpenseDistance?: number | null;
  customsWaitHours?: number | null;
  billableHours?: number | null;
  netProfit?: number | null;
  passengers?: number;
  children?: number;
  childSeats?: number;
  petsCount?: number;
  client: { name: string; phone: string | null };
  driver?: { user?: { name: string } } | null;
  car?: Car;
  status: string;
};

const statusLabel: Record<string, string> = {
  PENDING: 'Нова',
  CONFIRMED: 'Підтверджена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Скасована',
};

const statusClass: Record<string, string> = {
  PENDING: 'border-white/10 bg-white/5 text-white',
  CONFIRMED: 'border-[#e9c349]/40 bg-[#e9c349]/15 text-[#e9c349]',
  COMPLETED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  CANCELLED: 'border-red-400/30 bg-red-400/10 text-red-300',
};

function shortPlace(value: string) {
  return value.split(',')[0] || value;
}

function time(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'HH:mm', { locale: uk });
}

function dateTime(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd MMM, HH:mm', { locale: uk });
}

export default function DashboardCalendar({ cars, bookings }: { cars: Car[]; bookings: Booking[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(bookings[0]?.id || null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()),
    [bookings]
  );
  const selectedDayBookings = sortedBookings.filter((booking) => isSameDay(new Date(booking.dateStart), selectedDay));
  const selectedBooking = sortedBookings.find((booking) => booking.id === selectedId) || selectedDayBookings[0] || sortedBookings[0];

  const carFor = (booking: Booking) => booking.car || cars.find((car) => car.id === booking.carId);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131a] shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#080818] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-[#e9c349]" size={26} />
          <div>
            <h2 className="m-0 text-2xl font-bold text-white">Диспетчер рейсів</h2>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Подача, прибуття, авто, водій і фінанси без зайвої сітки.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/5">Попередній</button>
          <button onClick={() => { const today = startOfDay(new Date()); setWeekStart(startOfWeek(today, { weekStartsOn: 1 })); setSelectedDay(today); }} className="rounded-lg bg-[#e9c349] px-4 py-2 text-sm font-bold text-black">Сьогодні</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/5">Наступний</button>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
            {days.map((day) => {
              const dayBookings = sortedBookings.filter((booking) => isSameDay(new Date(booking.dateStart), day));
              const active = isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); setSelectedId(dayBookings[0]?.id || null); }}
                  className={`min-h-[86px] rounded-xl border p-3 text-left transition-colors ${
                    active ? 'border-[#e9c349] bg-[#e9c349]/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-[#8a8a93]">{format(day, 'EEE', { locale: uk })}</div>
                  <div className="mt-1 text-2xl font-bold text-white">{format(day, 'dd')}</div>
                  <div className="mt-2 text-xs text-[#e9c349]">{dayBookings.length} рейсів</div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3">
            {selectedDayBookings.map((booking) => {
              const car = carFor(booking);
              const active = selectedBooking?.id === booking.id;
              return (
                <button
                  key={booking.id}
                  onClick={() => setSelectedId(booking.id)}
                  className={`grid gap-3 rounded-xl border p-4 text-left transition-colors lg:grid-cols-[120px_1fr_auto] ${
                    active ? 'border-[#e9c349]/70 bg-[#e9c349]/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="text-2xl font-bold text-white">{time(booking.dateStart)}</div>
                    <div className="mt-1 text-xs text-[#8a8a93]">приб. {time(booking.dateEnd)}</div>
                    <div className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClass[booking.status] || statusClass.PENDING}`}>
                      {statusLabel[booking.status] || booking.status}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <MapPin size={15} className="text-[#e9c349]" />
                      <span className="truncate">{shortPlace(booking.routeFrom)} {'->'} {shortPlace(booking.routeTo)}</span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-[#c7c6ca] sm:grid-cols-3">
                      <span className="inline-flex items-center gap-1"><CarIcon size={14} /> {car ? `${car.make} ${car.model}` : 'Авто'}</span>
                      <span className="inline-flex items-center gap-1"><User size={14} /> {booking.driver?.user?.name || 'Водія не призначено'}</span>
                      <span className="inline-flex items-center gap-1"><Users size={14} /> {booking.passengers || 1}+{booking.children || 0}</span>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-lg font-bold text-[#e9c349]">€{Number(booking.price || 0).toFixed(0)}</div>
                    <div className="mt-1 text-xs text-emerald-300">profit €{Number(booking.netProfit || 0).toFixed(0)}</div>
                  </div>
                </button>
              );
            })}

            {selectedDayBookings.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-[#8a8a93]">
                На цей день рейсів немає.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-[#080818] p-5">
          {selectedBooking ? (
            <div className="space-y-5">
              <div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass[selectedBooking.status] || statusClass.PENDING}`}>
                  {statusLabel[selectedBooking.status] || selectedBooking.status}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{shortPlace(selectedBooking.routeFrom)} {'->'} {shortPlace(selectedBooking.routeTo)}</h3>
                <p className="mt-1 text-sm text-[#8a8a93]">{selectedBooking.client.name} • {selectedBooking.client.phone || 'телефон не вказано'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs uppercase tracking-widest text-[#8a8a93]"><Clock size={13} /> Виїзд</div>
                  <div className="font-bold text-white">{dateTime(selectedBooking.dateStart)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs uppercase tracking-widest text-[#8a8a93]"><Clock size={13} /> Прибуття</div>
                  <div className="font-bold text-white">{dateTime(selectedBooking.desiredArrivalAt || selectedBooking.dateEnd)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 text-xs uppercase tracking-widest text-[#8a8a93]">Виїзд з бази</div>
                  <div className="font-bold text-white">{dateTime(selectedBooking.carDispatchAt)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 text-xs uppercase tracking-widest text-[#8a8a93]">Митниця / робота</div>
                  <div className="font-bold text-white">{selectedBooking.customsWaitHours || 0} год / {selectedBooking.billableHours || 0} год</div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Клієнтський маршрут</span><strong className="text-white">{selectedBooking.distance} км</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Подача з бази</span><strong className="text-white">{selectedBooking.deliveryDistance || 0} км</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Повний пробіг</span><strong className="text-white">{selectedBooking.totalExpenseDistance || selectedBooking.distance} км</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-4">
                  <div className="mb-1 flex items-center gap-1 text-xs uppercase tracking-widest text-[#b9a35b]"><Euro size={13} /> Ціна</div>
                  <div className="text-2xl font-bold text-[#e9c349]">€{Number(selectedBooking.price || 0).toFixed(0)}</div>
                </div>
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">Прибуток</div>
                  <div className="text-2xl font-bold text-emerald-300">€{Number(selectedBooking.netProfit || 0).toFixed(0)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#8a8a93]">Оберіть рейс для деталей.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
