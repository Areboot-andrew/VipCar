'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { uk } from 'date-fns/locale/uk';
import {
  CalendarDays,
  Car as CarIcon,
  CheckCircle,
  Clock,
  Euro,
  MapPin,
  MessageSquare,
  Save,
  User,
  Users,
} from 'lucide-react';

type Car = {
  id: string;
  make: string;
  model: string;
};

type Driver = {
  id: string;
  user: { name: string };
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
  pickupAt?: string | null;
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
  driverNotes?: string | null;
  client: { name: string; phone: string | null; email?: string | null };
  driver?: { id?: string; user?: { name: string } } | null;
  car?: Car;
  status: string;
};

type Props = {
  cars: Car[];
  bookings: Booking[];
  drivers?: Driver[];
  onOpenChat?: (bookingId: string) => void;
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
  if (!value) return '--:--';
  return format(new Date(value), 'HH:mm', { locale: uk });
}

function dateTime(value?: string | null) {
  if (!value) return '--';
  return format(new Date(value), 'dd MMM, HH:mm', { locale: uk });
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function buildMonthDays(cursor: Date) {
  const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

function fieldClass() {
  return 'h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60';
}

export default function DashboardCalendar({ cars, bookings, drivers = [], onOpenChat }: Props) {
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [localDrivers, setLocalDrivers] = useState<Driver[]>(drivers);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(bookings[0]?.id || null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [editDraft, setEditDraft] = useState({
    dateStart: '',
    dateEnd: '',
    carDispatchAt: '',
    desiredArrivalAt: '',
    driverId: '',
    status: 'PENDING',
    driverNotes: '',
  });

  useEffect(() => setLocalBookings(bookings), [bookings]);

  useEffect(() => {
    if (drivers.length > 0) {
      setLocalDrivers(drivers);
      return;
    }
    fetch('/api/drivers')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setLocalDrivers(data))
      .catch(() => {});
  }, [drivers]);

  const sortedBookings = useMemo(
    () => [...localBookings].sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()),
    [localBookings]
  );

  const days = useMemo(() => {
    if (viewMode === 'month') return buildMonthDays(cursor);
    const first = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
  }, [cursor, viewMode]);

  const selectedDayBookings = sortedBookings.filter((booking) => isSameDay(new Date(booking.dateStart), selectedDay));
  const selectedBooking = sortedBookings.find((booking) => booking.id === selectedId) || selectedDayBookings[0] || null;

  useEffect(() => {
    if (!selectedBooking) return;
    setEditDraft({
      dateStart: toDateTimeLocal(selectedBooking.dateStart),
      dateEnd: toDateTimeLocal(selectedBooking.dateEnd),
      carDispatchAt: toDateTimeLocal(selectedBooking.carDispatchAt),
      desiredArrivalAt: toDateTimeLocal(selectedBooking.desiredArrivalAt || selectedBooking.dateEnd),
      driverId: selectedBooking.driverId || '',
      status: selectedBooking.status || 'PENDING',
      driverNotes: selectedBooking.driverNotes || '',
    });
  }, [selectedBooking?.id]);

  const carFor = (booking: Booking) => booking.car || cars.find((car) => car.id === booking.carId);

  const updateBooking = async (updates: Record<string, unknown>) => {
    if (!selectedBooking) return;
    setSaving(true);
    setNotice('');
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Update failed');
      setLocalBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? data : booking)));
      setSelectedId(data.id);
      setNotice('Рейс оновлено.');
    } catch {
      setNotice('Не вдалося оновити рейс.');
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = () => {
    updateBooking({
      dateStart: fromDateTimeLocal(editDraft.dateStart),
      pickupAt: fromDateTimeLocal(editDraft.dateStart),
      dateEnd: fromDateTimeLocal(editDraft.dateEnd),
      desiredArrivalAt: fromDateTimeLocal(editDraft.desiredArrivalAt),
      carDispatchAt: fromDateTimeLocal(editDraft.carDispatchAt),
      driverId: editDraft.driverId,
      status: editDraft.status,
      driverNotes: editDraft.driverNotes,
    });
  };

  const goPrevious = () => {
    const next = viewMode === 'month' ? addMonths(cursor, -1) : addDays(cursor, -7);
    setCursor(next);
    setSelectedDay(viewMode === 'month' ? startOfMonth(next) : startOfWeek(next, { weekStartsOn: 1 }));
  };

  const goNext = () => {
    const next = viewMode === 'month' ? addMonths(cursor, 1) : addDays(cursor, 7);
    setCursor(next);
    setSelectedDay(viewMode === 'month' ? startOfMonth(next) : startOfWeek(next, { weekStartsOn: 1 }));
  };

  const periodTitle = viewMode === 'month'
    ? format(cursor, 'LLLL yyyy', { locale: uk })
    : `${format(days[0], 'dd MMM', { locale: uk })} - ${format(days[6], 'dd MMM', { locale: uk })}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131a] shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#080818] p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-[#e9c349]" size={26} />
          <div>
            <h2 className="m-0 text-2xl font-bold text-white">Диспетчер рейсів</h2>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Календар, рейси, водії, нотатки та чат з клієнтом.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-1">
            <button onClick={() => setViewMode('week')} className={`rounded-md px-3 py-2 text-sm font-bold ${viewMode === 'week' ? 'bg-[#e9c349] text-black' : 'text-[#c7c6ca]'}`}>Тиждень</button>
            <button onClick={() => setViewMode('month')} className={`rounded-md px-3 py-2 text-sm font-bold ${viewMode === 'month' ? 'bg-[#e9c349] text-black' : 'text-[#c7c6ca]'}`}>Місяць</button>
          </div>
          <button onClick={goPrevious} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/5">Попередній</button>
          <button onClick={() => { const today = startOfDay(new Date()); setCursor(today); setSelectedDay(today); }} className="rounded-lg bg-[#e9c349] px-4 py-2 text-sm font-bold text-black">Сьогодні</button>
          <button onClick={goNext} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/5">Наступний</button>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-widest text-[#8a8a93]">
        {periodTitle}
      </div>

      <div className="grid gap-4 p-5 2xl:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <div className={`grid gap-2 ${viewMode === 'month' ? 'grid-cols-2 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-7'}`}>
            {days.map((day) => {
              const dayBookings = sortedBookings.filter((booking) => isSameDay(new Date(booking.dateStart), day));
              const active = isSameDay(day, selectedDay);
              const muted = viewMode === 'month' && !isSameMonth(day, cursor);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); setSelectedId(dayBookings[0]?.id || null); }}
                  className={`min-h-[104px] rounded-xl border p-3 text-left transition-colors ${
                    active ? 'border-[#e9c349] bg-[#e9c349]/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  } ${muted ? 'opacity-45' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-[#8a8a93]">{format(day, 'EEE', { locale: uk })}</div>
                      <div className="mt-1 text-2xl font-bold text-white">{format(day, 'dd')}</div>
                    </div>
                    <div className="rounded-full bg-[#e9c349]/10 px-2 py-1 text-xs font-bold text-[#e9c349]">{dayBookings.length}</div>
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {dayBookings.slice(0, viewMode === 'month' ? 2 : 3).map((booking) => (
                        <div key={booking.id} className="truncate rounded bg-black/25 px-2 py-1 text-[11px] text-white">
                          {time(booking.dateStart)} {shortPlace(booking.routeTo)}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="m-0 text-lg font-bold text-white">{format(selectedDay, 'dd MMMM yyyy', { locale: uk })}</h3>
                <p className="m-0 mt-1 text-sm text-[#8a8a93]">Список рейсів за вибрану дату</p>
              </div>
              {notice && <div className="text-sm text-[#e9c349]">{notice}</div>}
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
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-bold text-white">Редагування рейсу</div>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Виїзд з клієнтом<input type="datetime-local" value={editDraft.dateStart} onChange={(e) => setEditDraft({ ...editDraft, dateStart: e.target.value })} className={fieldClass()} /></label>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Прибуття<input type="datetime-local" value={editDraft.dateEnd} onChange={(e) => setEditDraft({ ...editDraft, dateEnd: e.target.value, desiredArrivalAt: e.target.value })} className={fieldClass()} /></label>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Виїзд авто з бази<input type="datetime-local" value={editDraft.carDispatchAt} onChange={(e) => setEditDraft({ ...editDraft, carDispatchAt: e.target.value })} className={fieldClass()} /></label>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Водій
                  <select value={editDraft.driverId} onChange={(e) => setEditDraft({ ...editDraft, driverId: e.target.value })} className={fieldClass()}>
                    <option value="">Не призначено</option>
                    {localDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.user.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Статус
                  <select value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })} className={fieldClass()}>
                    <option value="PENDING">Нова</option>
                    <option value="CONFIRMED">Підтверджена</option>
                    <option value="COMPLETED">Завершена</option>
                    <option value="CANCELLED">Скасована</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs uppercase tracking-widest text-[#8a8a93]">Нотатки для водія
                  <textarea rows={4} value={editDraft.driverNotes} onChange={(e) => setEditDraft({ ...editDraft, driverNotes: e.target.value })} className="w-full resize-y rounded-lg border border-white/10 bg-[#080818] p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <button onClick={saveDetails} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-3 text-sm font-bold text-black disabled:opacity-60">
                  <Save size={16} /> {saving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Клієнтський маршрут</span><strong className="text-white">{selectedBooking.distance} км</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Подача з бази</span><strong className="text-white">{selectedBooking.deliveryDistance || 0} км</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Повний пробіг</span><strong className="text-white">{selectedBooking.totalExpenseDistance || selectedBooking.distance} км</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Митниця / робота</span><strong className="text-white">{selectedBooking.customsWaitHours || 0} / {selectedBooking.billableHours || 0} год</strong></div>
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

              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={() => onOpenChat?.(selectedBooking.id)} disabled={!onOpenChat} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm font-bold text-blue-300 disabled:opacity-50">
                  <MessageSquare size={16} /> Чат
                </button>
                <button onClick={() => updateBooking({ status: 'CONFIRMED' })} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e9c349]/30 bg-[#e9c349]/10 px-4 py-3 text-sm font-bold text-[#e9c349]">
                  <CheckCircle size={16} /> Підтвердити
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#8a8a93]">Оберіть дату і рейс для деталей.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
