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
  Home,
  Luggage,
  MapPin,
  MessageSquare,
  PawPrint,
  Route,
  Save,
  Send,
  User,
  Users,
  Baby,
  WalletCards,
} from 'lucide-react';

type Car = {
  id: string;
  make: string;
  model: string;
  year?: number;
  capacity?: number;
  luggageCapacity?: number;
  comfortClass?: string;
  bodyType?: string | null;
  baseCity?: string | null;
};

type Driver = {
  id: string;
  user: { name: string };
};

type Invoice = {
  id: string;
  amount: number;
  depositAmount?: number;
  paidAmount?: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  status: string;
};

type Booking = {
  id: string;
  carId: string;
  driverId?: string | null;
  routeFrom: string;
  routeTo: string;
  distance: number;
  price: number;
  promoCode?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  dateStart: string;
  dateEnd: string;
  desiredArrivalAt?: string | null;
  pickupAt?: string | null;
  carDispatchAt?: string | null;
  estimatedArrivalAt?: string | null;
  deliveryDistance?: number | null;
  deliveryDurationMins?: number | null;
  totalExpenseDistance?: number | null;
  routeDurationMins?: number | null;
  customsWaitHours?: number | null;
  manualWaitingHours?: number | null;
  billableHours?: number | null;
  fuelCost?: number | null;
  driverSalary?: number | null;
  deliveryCost?: number | null;
  amortization?: number | null;
  timeCost?: number | null;
  hotelCost?: number | null;
  surcharges?: number | null;
  netProfit?: number | null;
  passengers?: number;
  children?: number;
  childSeats?: number;
  luggage?: string;
  animals?: boolean;
  petsCount?: number;
  isEndingAtBase?: boolean;
  returnToBaseDistance?: number | null;
  returnToBaseAt?: string | null;
  carStartLocation?: string | null;
  driverNotes?: string | null;
  notes?: string | null;
  client: { name: string; phone: string | null; email?: string | null };
  driver?: { id?: string; user?: { name: string } } | null;
  car?: Car;
  invoice?: Invoice | null;
  status: string;
};

const PAY_METHODS = [
  { value: 'CASH', label: 'Готівка' },
  { value: 'CARD', label: 'Карта' },
  { value: 'USDT', label: 'USDT' },
  { value: 'BANK', label: 'Банк. переказ' },
];

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

function money(value?: number | null) {
  return `€${Number(value || 0).toFixed(0)}`;
}

function km(value?: number | null) {
  return `${Number(value || 0).toFixed(0)} км`;
}

function hours(value?: number | null) {
  return `${Number(value || 0).toFixed(1)} год`;
}

function minutesToLabel(value?: number | null) {
  const total = Number(value || 0);
  if (!total) return '0 хв';
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
}

function estimatedBaseReturn(booking: Booking) {
  const end = new Date(booking.estimatedArrivalAt || booking.dateEnd);
  if (Number.isNaN(end.getTime())) return null;
  if (booking.isEndingAtBase) return end;
  const returnDistance = Number(booking.returnToBaseDistance || booking.deliveryDistance || 0);
  if (!returnDistance) return null;
  return new Date(end.getTime() + Math.ceil((returnDistance / 55) * 60) * 60000);
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
  const [priceDraft, setPriceDraft] = useState('');
  const [depositDraft, setDepositDraft] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [financeNotice, setFinanceNotice] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [editDraft, setEditDraft] = useState({
    dateStart: '',
    dateEnd: '',
    carDispatchAt: '',
    desiredArrivalAt: '',
    driverId: '',
    status: 'PENDING',
    isEndingAtBase: false,
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
      isEndingAtBase: Boolean(selectedBooking.isEndingAtBase),
      driverNotes: selectedBooking.driverNotes || '',
    });
    setPriceDraft(String(Math.round(Number(selectedBooking.price || 0))));
    setDepositDraft(String(Math.round(Number(selectedBooking.invoice?.depositAmount || 0))));
    setPayMethod(selectedBooking.invoice?.paymentMethod || 'CASH');
    setFinanceNotice('');
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

  const savePrice = () => {
    const value = Number(priceDraft);
    if (!Number.isFinite(value) || value < 0) {
      setFinanceNotice('Некоректна сума.');
      return;
    }
    updateBooking({ price: value });
  };

  const patchInvoice = async (payload: Record<string, unknown>, successMessage = 'Оплату оновлено.') => {
    if (!selectedBooking?.invoice) {
      setFinanceNotice('Рахунок ще не створено. Спершу відкоригуй та збережи ціну.');
      return;
    }
    setFinanceNotice('');
    try {
      const res = await fetch(`/api/invoices/${selectedBooking.invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const invoice = await res.json();
      if (!res.ok) throw new Error('Invoice update failed');
      setLocalBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? { ...booking, invoice } : booking)));
      setFinanceNotice(successMessage);
    } catch {
      setFinanceNotice('Не вдалося оновити оплату.');
    }
  };

  // Stage actions: deposit receipt, balance/full-payment receipt, silent undo
  const confirmDeposit = () => {
    const deposit = Math.max(0, Math.round(Number(depositDraft) || 0));
    if (deposit <= 0) {
      setFinanceNotice('Вкажи суму завдатку більше 0.');
      return;
    }
    patchInvoice(
      { paidAmount: deposit, depositAmount: deposit, paymentMethod: payMethod, paidAt: new Date().toISOString(), notifyClient: true },
      `Завдаток €${deposit} зафіксовано. Квитанцію надіслано клієнту в чат.`
    );
  };

  const confirmFullPayment = () => {
    patchInvoice(
      { status: 'PAID', paymentMethod: payMethod, notifyClient: true },
      'Оплату зафіксовано повністю. Квитанцію надіслано клієнту в чат.'
    );
  };

  const undoPayment = () => {
    patchInvoice({ status: 'UNPAID' }, 'Оплату скинуто. Клієнту нічого не надсилалось.');
  };

  const sendPaymentToChat = async () => {
    if (!selectedBooking) return;
    setSendingInvoice(true);
    setFinanceNotice('');
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/send-payment`, { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      setFinanceNotice('Рахунок надіслано клієнту в чат замовлення.');
    } catch {
      setFinanceNotice('Не вдалося надіслати рахунок.');
    } finally {
      setSendingInvoice(false);
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
      isEndingAtBase: editDraft.isEndingAtBase,
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
  const selectedBookingCar = selectedBooking ? carFor(selectedBooking) : null;
  const selectedReturnAt = selectedBooking?.returnToBaseAt ? new Date(selectedBooking.returnToBaseAt) : selectedBooking ? estimatedBaseReturn(selectedBooking) : null;

  // Finance summary for the selected booking
  const invoice = selectedBooking?.invoice || null;
  const invoicePaid = Number(invoice?.paidAmount || 0);
  const invoiceDeposit = Number(invoice?.depositAmount || 0);
  const bookingPrice = Number(selectedBooking?.price || 0);
  const invoiceRemaining = Math.max(0, Math.round(bookingPrice - invoicePaid));
  const internalCost = selectedBooking
    ? Number(selectedBooking.fuelCost || 0) +
      Number(selectedBooking.driverSalary || 0) +
      Number(selectedBooking.deliveryCost || 0) +
      Number(selectedBooking.amortization || 0) +
      Number(selectedBooking.hotelCost || 0)
    : 0;
  const profit = Number(selectedBooking?.netProfit ?? (bookingPrice - internalCost));
  const marginPercent = bookingPrice > 0 ? Math.round((profit / bookingPrice) * 100) : 0;

  // Payment stage (booking.com-style): awaiting deposit -> deposit paid -> fully paid
  const paymentStage: 'awaiting' | 'deposit_paid' | 'paid' =
    bookingPrice > 0 && invoiceRemaining === 0 ? 'paid'
    : invoicePaid > 0 && invoiceDeposit > 0 && invoicePaid >= invoiceDeposit ? 'deposit_paid'
    : 'awaiting';
  // What the client owes right now: deposit first, then the balance
  const dueNow = paymentStage === 'awaiting' && invoiceDeposit > 0
    ? Math.max(0, invoiceDeposit - invoicePaid)
    : invoiceRemaining;

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

      <div className="grid min-w-0 gap-4 p-3 sm:p-4 xl:p-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
                  className={`min-h-[92px] rounded-xl border p-3 text-left transition-colors sm:min-h-[104px] ${
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
                const returnAt = estimatedBaseReturn(booking);
                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedId(booking.id)}
                    className={`grid min-w-0 gap-4 rounded-xl border p-4 text-left transition-colors 2xl:grid-cols-[108px_minmax(0,1fr)_170px] ${
                      active ? 'border-[#e9c349]/70 bg-[#e9c349]/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="text-2xl font-bold text-white">{time(booking.dateStart)}</div>
                      <div className="mt-1 text-xs text-[#8a8a93]">приб. {time(booking.desiredArrivalAt || booking.dateEnd)}</div>
                      <div className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClass[booking.status] || statusClass.PENDING}`}>
                        {statusLabel[booking.status] || booking.status}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-bold text-white md:text-base">
                        <MapPin size={15} className="text-[#e9c349]" />
                        <span className="truncate">{shortPlace(booking.routeFrom)} {'->'} {shortPlace(booking.routeTo)}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-[#c7c6ca] md:grid-cols-2 xl:grid-cols-3">
                        <span className="inline-flex items-center gap-1 font-bold text-white"><User size={14} className="text-[#e9c349]" /> {booking.client.name}{booking.client.phone ? ` • ${booking.client.phone}` : ''}</span>
                        <span className="inline-flex items-center gap-1"><CarIcon size={14} /> {car ? `${car.make} ${car.model}` : 'Авто не знайдено'}</span>
                        <span className="inline-flex items-center gap-1"><User size={14} /> {booking.driver?.user?.name || 'Водія не призначено'}</span>
                        <span className="inline-flex items-center gap-1"><Users size={14} /> {booking.passengers || 1} дор. / {booking.children || 0} діт.</span>
                        <span className="inline-flex items-center gap-1"><Luggage size={14} /> {booking.luggage || 'Багаж не вказано'}</span>
                        <span className="inline-flex items-center gap-1"><Baby size={14} /> крісла: {booking.childSeats || 0}</span>
                        <span className="inline-flex items-center gap-1"><PawPrint size={14} /> тварини: {booking.petsCount || 0}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] text-[#8a8a93] md:grid-cols-3">
                        <span className="rounded-lg bg-black/20 px-2 py-1">з бази: {dateTime(booking.carDispatchAt)}</span>
                        <span className="rounded-lg bg-black/20 px-2 py-1">клієнт: {dateTime(booking.pickupAt || booking.dateStart)}</span>
                        <span className="rounded-lg bg-black/20 px-2 py-1">на базу: {returnAt ? format(returnAt, 'dd MMM, HH:mm', { locale: uk }) : '--'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs 2xl:block 2xl:text-right">
                      <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-2 2xl:border-0 2xl:bg-transparent 2xl:p-0">
                        <div className="text-[#8a8a93]">ціна</div>
                        <div className="text-lg font-bold text-[#e9c349]">{money(booking.price)}</div>
                      </div>
                      <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 2xl:mt-2 2xl:border-0 2xl:bg-transparent 2xl:p-0">
                        <div className="text-[#8a8a93]">прибуток</div>
                        <div className="text-lg font-bold text-emerald-300">{money(booking.netProfit)}</div>
                      </div>
                      <div className="col-span-2 mt-1 text-[#8a8a93] 2xl:mt-3">
                        {km(booking.distance)} маршрут / {km(booking.totalExpenseDistance || booking.distance)} повний пробіг
                      </div>
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
              <div className="rounded-xl border border-[#e9c349]/20 bg-[#e9c349]/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass[selectedBooking.status] || statusClass.PENDING}`}>
                      {statusLabel[selectedBooking.status] || selectedBooking.status}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-white">{shortPlace(selectedBooking.routeFrom)} {'->'} {shortPlace(selectedBooking.routeTo)}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#c7c6ca]">
                      Рейс #{selectedBooking.id.slice(0, 8)}: авто виїжджає з {selectedBooking.carStartLocation || selectedBookingCar?.baseCity || 'бази'}, забирає клієнта у точці старту і рухається до {shortPlace(selectedBooking.routeTo)}.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs uppercase tracking-widest text-[#8a8a93]">Ціна / профіт</div>
                    <div className="mt-1 text-2xl font-bold text-[#e9c349]">{money(selectedBooking.price)}</div>
                    <div className="text-sm font-bold text-emerald-300">{money(selectedBooking.netProfit)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e9c349]/25 bg-[#e9c349]/10 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#b9a35b]"><User size={14} /> Клієнт</div>
                <div className="text-lg font-bold text-white">{selectedBooking.client.name}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {selectedBooking.client.phone ? (
                    <a href={`tel:${selectedBooking.client.phone}`} className="font-bold text-[#e9c349] hover:underline">{selectedBooking.client.phone}</a>
                  ) : (
                    <span className="text-[#8a8a93]">телефон не вказано</span>
                  )}
                  {selectedBooking.client.email && (
                    <a href={`mailto:${selectedBooking.client.email}`} className="text-[#e9c349] hover:underline">{selectedBooking.client.email}</a>
                  )}
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#8a8a93]"><CarIcon size={14} /> Авто</div>
                  <div className="font-bold text-white">{selectedBookingCar ? `${selectedBookingCar.make} ${selectedBookingCar.model}` : 'Авто не знайдено'}</div>
                  <div className="mt-1 text-xs text-[#8a8a93]">{selectedBookingCar?.year || '--'} • {selectedBookingCar?.comfortClass || 'клас не вказано'} • {selectedBookingCar?.capacity || '--'} місць</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#8a8a93]"><User size={14} /> Водій</div>
                  <div className="font-bold text-white">{selectedBooking.driver?.user?.name || 'Водія не призначено'}</div>
                  <div className="mt-1 text-xs text-[#8a8a93]">{selectedBookingCar?.baseCity ? `база: ${selectedBookingCar.baseCity}` : 'база не вказана'}</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Route size={16} className="text-[#e9c349]" /> Маршрут і таймлайн</div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Звідки виїхало авто</span><strong className="text-right text-white">{selectedBooking.carStartLocation || selectedBookingCar?.baseCity || 'База'}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Виїзд авто з бази</span><strong className="text-right text-white">{dateTime(selectedBooking.carDispatchAt)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Подача клієнту</span><strong className="text-right text-white">{dateTime(selectedBooking.pickupAt || selectedBooking.dateStart)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Куди їде</span><strong className="text-right text-white">{shortPlace(selectedBooking.routeTo)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Прибуття клієнта</span><strong className="text-right text-white">{dateTime(selectedBooking.desiredArrivalAt || selectedBooking.dateEnd)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Орієнтовно на базі</span><strong className="text-right text-white">{selectedReturnAt ? format(selectedReturnAt, 'dd MMM, HH:mm', { locale: uk }) : selectedBooking.isEndingAtBase ? dateTime(selectedBooking.dateEnd) : 'лишається у точці прибуття'}</strong></div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Users size={16} className="text-[#e9c349]" /> Пасажири й опції</div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Дорослі</span><strong className="text-white">{selectedBooking.passengers || 1}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Діти</span><strong className="text-white">{selectedBooking.children || 0}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Дитячі крісла</span><strong className="text-white">{selectedBooking.childSeats || 0}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Багаж</span><strong className="text-right text-white">{selectedBooking.luggage || 'Немає'}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Тварини</span><strong className="text-white">{selectedBooking.petsCount || 0}</strong></div>
                    {selectedBooking.notes && (
                      <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-3 sm:col-span-2">
                        <span className="block text-xs uppercase tracking-widest text-[#b9a35b]">Сервісна опція</span>
                        <strong className="mt-1 block text-white">{selectedBooking.notes}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Home size={16} className="text-[#e9c349]" /> Дистанції</div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Клієнтський маршрут</span><strong className="text-white">{km(selectedBooking.distance)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Подача з бази</span><strong className="text-white">{km(selectedBooking.deliveryDistance)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Повернення на базу</span><strong className="text-white">{km(selectedBooking.returnToBaseDistance)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Повний пробіг</span><strong className="text-white">{km(selectedBooking.totalExpenseDistance || selectedBooking.distance)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Час маршруту</span><strong className="text-white">{minutesToLabel(selectedBooking.routeDurationMins)}</strong></div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><WalletCards size={16} className="text-[#e9c349]" /> Фінанси рейсу</div>

                {/* Оплата: статус -> рахунок списком -> дії за етапом */}
                <div className={`rounded-lg border p-3 ${paymentStage === 'paid' ? 'border-emerald-400/30 bg-emerald-400/[0.07]' : 'border-[#e9c349]/25 bg-[#e9c349]/[0.07]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#b9a35b]">Оплата</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      paymentStage === 'paid' ? 'bg-emerald-400/15 text-emerald-300'
                      : paymentStage === 'deposit_paid' ? 'bg-sky-400/15 text-sky-300'
                      : 'bg-[#e9c349]/15 text-[#e9c349]'
                    }`}>
                      {paymentStage === 'paid' ? '✓ Оплачено повністю'
                        : paymentStage === 'deposit_paid' ? `Завдаток сплачено · залишок ${money(invoiceRemaining)}`
                        : invoiceDeposit > 0 ? `Очікує завдаток ${money(invoiceDeposit)}` : 'Очікує оплату'}
                    </span>
                  </div>

                  {/* Рахунок */}
                  <div className="mt-3 grid gap-1.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8a8a93]">Повна ціна</span>
                      <span className="flex items-center gap-1.5">
                        <input type="number" min="0" value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} className="h-8 w-24 rounded-md border border-white/10 bg-[#080818] px-2 text-right text-sm font-bold text-white outline-none focus:border-[#e9c349]/60" />
                        <button onClick={savePrice} disabled={saving} title="Зберегти нову ціну (оновить завдаток і прибуток)" className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e9c349] text-black disabled:opacity-60">
                          <Save size={13} />
                        </button>
                      </span>
                    </div>
                    {Number(selectedBooking.surcharges || 0) > 0 && (
                      <div className="flex justify-between gap-3 text-xs"><span className="text-[#8a8a93]">у т.ч. опції (крісла, тварини, зустріч)</span><span className="text-[#c7c6ca]">{money(selectedBooking.surcharges)}</span></div>
                    )}
                    {Number(selectedBooking.discountPercent || 0) > 0 && (
                      <div className="flex justify-between gap-3 text-xs"><span className="text-[#8a8a93]">знижка клієнта</span><span className="text-[#c7c6ca]">−{Number(selectedBooking.discountPercent).toFixed(0)}% ({money(selectedBooking.discountAmount)})</span></div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#8a8a93]">Завдаток</span>
                      <input
                        type="number"
                        min="0"
                        value={depositDraft}
                        onChange={(e) => setDepositDraft(e.target.value)}
                        onBlur={() => {
                          const value = Math.max(0, Math.round(Number(depositDraft) || 0));
                          if (value !== invoiceDeposit) patchInvoice({ depositAmount: value }, 'Суму завдатку оновлено.');
                        }}
                        className="h-8 w-24 rounded-md border border-white/10 bg-[#080818] px-2 text-right text-sm font-bold text-white outline-none focus:border-[#e9c349]/60"
                      />
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[#8a8a93]">Сплачено</span>
                      <strong className={invoicePaid > 0 ? 'text-emerald-300' : 'text-white'}>
                        {money(invoicePaid)}{invoice?.paidAt && invoicePaid > 0 ? ` · ${dateTime(invoice.paidAt)}` : ''}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-white/10 pt-1.5">
                      <span className="font-bold text-[#c7c6ca]">Залишок</span>
                      <strong className={invoiceRemaining === 0 ? 'text-emerald-300' : 'text-[#e9c349]'}>{invoiceRemaining === 0 ? '€0 — оплачено' : money(invoiceRemaining)}</strong>
                    </div>
                  </div>

                  {/* Дії: одна головна кнопка на кожному етапі */}
                  <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
                    {paymentStage !== 'paid' && (
                      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2">
                        <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#080818] px-2 text-sm text-white outline-none focus:border-[#e9c349]/60">
                          {PAY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        {paymentStage === 'awaiting' && invoiceDeposit > 0 ? (
                          <button onClick={confirmDeposit} className="h-10 rounded-lg bg-[#e9c349] px-3 text-sm font-bold text-black">
                            ✓ Завдаток {money(Math.max(0, Math.round(Number(depositDraft) || 0)))} отримано
                          </button>
                        ) : (
                          <button onClick={confirmFullPayment} className="h-10 rounded-lg bg-emerald-400 px-3 text-sm font-bold text-black">
                            ✓ {paymentStage === 'deposit_paid' ? 'Доплата' : 'Оплата'} {money(invoiceRemaining)} отримана
                          </button>
                        )}
                      </div>
                    )}
                    {paymentStage === 'awaiting' && invoiceDeposit > 0 && (
                      <button onClick={confirmFullPayment} className="h-9 rounded-lg border border-emerald-400/40 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10">
                        Клієнт оплатив одразу всю суму {money(invoiceRemaining)}
                      </button>
                    )}
                    {invoiceRemaining > 0 && (
                      <button onClick={sendPaymentToChat} disabled={sendingInvoice} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e9c349]/40 bg-[#e9c349]/10 px-4 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/20 disabled:opacity-60">
                        <Send size={15} /> {sendingInvoice ? 'Надсилаємо...' : `Надіслати рахунок клієнту (до сплати ${money(dueNow)})`}
                      </button>
                    )}
                    {invoicePaid > 0 && (
                      <button onClick={undoPayment} className="justify-self-start text-xs text-[#8a8a93] underline-offset-2 hover:text-[#c7c6ca] hover:underline">
                        ↩ Скасувати оплату (клієнту нічого не надсилається)
                      </button>
                    )}
                    {financeNotice && <div className="rounded-lg border border-[#e9c349]/25 bg-[#e9c349]/10 px-3 py-2 text-xs text-[#e9c349]">{financeNotice}</div>}
                  </div>
                </div>

                {/* Видатки (собівартість) */}
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8a8a93]">Видатки (собівартість)</div>
                  <div className="grid gap-1.5 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Пальне / зарядка</span><strong className="text-white">{money(selectedBooking.fuelCost)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">ЗП водію</span><strong className="text-white">{money(selectedBooking.driverSalary)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Подача авто</span><strong className="text-white">{money(selectedBooking.deliveryCost)}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Амортизація</span><strong className="text-white">{money(selectedBooking.amortization)}</strong></div>
                    {Number(selectedBooking.hotelCost || 0) > 0 && (
                      <div className="flex justify-between gap-4"><span className="text-[#8a8a93]">Готель водія</span><strong className="text-white">{money(selectedBooking.hotelCost)}</strong></div>
                    )}
                    <div className="mt-1 flex justify-between gap-4 border-t border-white/10 pt-2">
                      <span className="font-bold text-[#c7c6ca]">Разом собівартість</span>
                      <strong className="text-white">{money(internalCost)}</strong>
                    </div>
                    <div className="flex justify-between gap-4 text-xs text-[#8a8a93]">
                      <span>Митниця {hours(selectedBooking.customsWaitHours)} • робочий час {hours(selectedBooking.billableHours)}</span>
                    </div>
                  </div>
                </div>

                {/* Прибуток */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Прибуток рейсу</div>
                    <div className="text-xs text-[#8a8a93]">маржа ~{marginPercent}% від ціни</div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-300">{money(profit)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-sm font-bold text-white">Редагування рейсу</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Виїзд з клієнтом
                    <input type="datetime-local" value={editDraft.dateStart} onChange={(e) => setEditDraft({ ...editDraft, dateStart: e.target.value })} className={fieldClass()} />
                  </label>
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Прибуття
                    <input type="datetime-local" value={editDraft.dateEnd} onChange={(e) => setEditDraft({ ...editDraft, dateEnd: e.target.value, desiredArrivalAt: e.target.value })} className={fieldClass()} />
                  </label>
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Виїзд авто з бази
                    <input type="datetime-local" value={editDraft.carDispatchAt} onChange={(e) => setEditDraft({ ...editDraft, carDispatchAt: e.target.value })} className={fieldClass()} />
                  </label>
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Водій
                    <select value={editDraft.driverId} onChange={(e) => setEditDraft({ ...editDraft, driverId: e.target.value })} className={fieldClass()}>
                      <option value="">Не призначено</option>
                      {localDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.user.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Статус рейсу
                    <select value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })} className={fieldClass()}>
                      <option value="PENDING">Нова</option>
                      <option value="CONFIRMED">Підтверджена</option>
                      <option value="COMPLETED">Завершена</option>
                      <option value="CANCELLED">Скасована</option>
                    </select>
                  </label>
                  <label className="flex h-10 items-center gap-2 self-end rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-[#c7c6ca]">
                    <input
                      type="checkbox"
                      checked={editDraft.isEndingAtBase}
                      onChange={(e) => setEditDraft({ ...editDraft, isEndingAtBase: e.target.checked })}
                      className="h-4 w-4 accent-[#e9c349]"
                    />
                    <span className="font-bold text-white">Повернути авто на базу</span>
                  </label>
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8a8a93] sm:col-span-2">Нотатки для водія
                    <textarea rows={3} value={editDraft.driverNotes} onChange={(e) => setEditDraft({ ...editDraft, driverNotes: e.target.value })} placeholder="Багаж, діти, тварини, зустріч, особливості клієнта..." className="w-full resize-y rounded-lg border border-white/10 bg-[#080818] p-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-[#56565f] focus:border-[#e9c349]/60" />
                  </label>
                </div>
                <button onClick={saveDetails} disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-3 text-sm font-bold text-black disabled:opacity-60">
                  <Save size={16} /> {saving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
                <p className="mb-0 mt-2 text-[11px] leading-4 text-[#6f6f78]">
                  «Повернути на базу» автоматично перерахує км повернення, робочі години, ночівлю водія (для довгих рейсів) і прибуток.
                </p>
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
