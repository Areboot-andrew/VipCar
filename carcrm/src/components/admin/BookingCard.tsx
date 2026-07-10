'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  CalendarClock,
  Car,
  Route,
  UserRound,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

const EmptyLegRouteMap = dynamic(() => import('@/components/EmptyLegRouteMap'), { ssr: false });

import { BOOKING_STATUS_CLASS, BOOKING_STATUS_LABEL, km, money, shortPlace } from '@/lib/format';

export type DashboardBooking = {
  id: string;
  status: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  dateEnd: string;
  pickupAt?: string | null;
  carDispatchAt?: string | null;
  desiredArrivalAt?: string | null;
  returnToBaseAt?: string | null;
  isEndingAtBase?: boolean;
  distance: number;
  deliveryDistance?: number | null;
  returnToBaseDistance?: number | null;
  totalExpenseDistance?: number | null;
  routeDurationMins?: number | null;
  billableHours?: number | null;
  customsWaitHours?: number | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  price: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
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
  luggage?: string | null;
  petsCount?: number | null;
  notes?: string | null;
  client: { name: string; phone?: string | null; email?: string | null };
  car: { make: string; model: string; year?: number | null; comfortClass?: string | null; plateNumber?: string | null };
  driver?: { user?: { name: string; phone?: string | null } | null } | null;
  invoice?: { amount: number; depositAmount?: number; paidAmount?: number; paidAt?: string | null; paymentMethod?: string | null; status: string } | null;
};

const statusLabel = BOOKING_STATUS_LABEL;
const statusClass = BOOKING_STATUS_CLASS;
const eur = money;

const dt = (value?: string | null) =>
  value ? new Date(value).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--';

function expensesOf(b: DashboardBooking) {
  return (
    Number(b.fuelCost || 0) +
    Number(b.driverSalary || 0) +
    Number(b.deliveryCost || 0) +
    Number(b.amortization || 0) +
    Number(b.timeCost || 0) +
    Number(b.hotelCost || 0) +
    Number(b.surcharges || 0)
  );
}

function profitOf(b: DashboardBooking) {
  if (b.netProfit !== null && b.netProfit !== undefined) return Number(b.netProfit);
  return Number(b.price || 0) - expensesOf(b);
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[#8a8a93]">{label}</span>
      <span className={`text-right ${strong ? 'font-bold text-white' : 'text-[#e4e2e3]'}`}>{value}</span>
    </div>
  );
}

function DetailsModal({ booking, onClose }: { booking: DashboardBooking; onClose: () => void }) {
  const paid = Number(booking.invoice?.paidAmount || 0);
  const deposit = Number(booking.invoice?.depositAmount || 0);
  const remaining = Math.max(0, Math.round(Number(booking.price || 0) - paid));
  const internal =
    Number(booking.fuelCost || 0) + Number(booking.driverSalary || 0) + Number(booking.deliveryCost || 0) +
    Number(booking.amortization || 0) + Number(booking.hotelCost || 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="my-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#10101a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass[booking.status] || statusClass.PENDING}`}>
                {statusLabel[booking.status] || booking.status}
              </span>
              <span className="text-sm text-[#8a8a93]">#{booking.id.slice(0, 8)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-black text-white">
              <span>{shortPlace(booking.routeFrom)}</span>
              <ArrowRight size={20} className="text-[#e9c349]" />
              <span>{shortPlace(booking.routeTo)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#c7c6ca]">
              <span className="font-bold text-white">{booking.client.name}</span>
              {booking.client.phone && (
                <a href={`tel:${booking.client.phone}`} className="text-[#e9c349] hover:underline" onClick={(e) => e.stopPropagation()}>
                  {booking.client.phone}
                </a>
              )}
              {booking.client.email && (
                <a href={`mailto:${booking.client.email}`} className="text-[#e9c349] hover:underline" onClick={(e) => e.stopPropagation()}>
                  {booking.client.email}
                </a>
              )}
              <span>{booking.car.make} {booking.car.model}</span>
              <span>{booking.driver?.user?.name || 'водія не призначено'}</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right">
              <div className="text-xl font-black text-[#e9c349]">{eur(booking.price)}</div>
              <div className="text-sm font-bold text-emerald-300">прибуток {eur(profitOf(booking))}</div>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-[#c7c6ca] hover:bg-white/5 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {/* Map */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080818] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-white"><Route size={15} className="text-[#e9c349]" /> Маршрут</span>
              <span className="text-xs font-bold text-[#c7c6ca]">{km(booking.distance)} • {Math.floor(Number(booking.routeDurationMins || 0) / 60)} год {Number(booking.routeDurationMins || 0) % 60} хв</span>
            </div>
            <div className="h-[260px]">
              <EmptyLegRouteMap
                from={{ lat: booking.originLat, lng: booking.originLng, label: shortPlace(booking.routeFrom) }}
                to={{ lat: booking.destinationLat, lng: booking.destinationLng, label: shortPlace(booking.routeTo) }}
              />
            </div>
          </div>

          {/* Timeline + distances */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><CalendarClock size={15} className="text-[#e9c349]" /> Таймлайн і дистанції</div>
            <div className="grid gap-1.5">
              <Row label="Виїзд авто з бази" value={dt(booking.carDispatchAt)} />
              <Row label="Подача клієнту" value={dt(booking.pickupAt || booking.dateStart)} strong />
              <Row label="Прибуття" value={dt(booking.desiredArrivalAt || booking.dateEnd)} strong />
              <Row label="Повернення на базу" value={booking.isEndingAtBase ? dt(booking.returnToBaseAt) : 'лишається у точці прибуття'} />
              <div className="my-2 border-t border-white/10"></div>
              <Row label="Клієнтський маршрут" value={km(booking.distance)} />
              <Row label="Подача з бази" value={km(booking.deliveryDistance)} />
              <Row label="Повернення на базу" value={km(booking.returnToBaseDistance)} />
              <Row label="Повний пробіг" value={km(booking.totalExpenseDistance || booking.distance)} strong />
              <Row label="Митниця / робочий час" value={`${Number(booking.customsWaitHours || 0)} год / ${Number(booking.billableHours || 0)} год`} />
            </div>
          </div>

          {/* Passengers */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Users size={15} className="text-[#e9c349]" /> Пасажири й опції</div>
            <div className="grid gap-1.5">
              <Row label="Дорослі / діти" value={`${booking.passengers || 1} / ${booking.children || 0}`} />
              <Row label="Дитячі крісла" value={String(booking.childSeats || 0)} />
              <Row label="Багаж" value={booking.luggage || 'Немає'} />
              <Row label="Тварини" value={String(booking.petsCount || 0)} />
              {booking.car.plateNumber && <Row label="Держномер авто" value={booking.car.plateNumber} />}
              {booking.driver?.user?.phone && <Row label="Телефон водія" value={booking.driver.user.phone} />}
              {booking.notes && (
                <div className="mt-2 rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-3 text-sm text-white">{booking.notes}</div>
              )}
            </div>
          </div>

          {/* Finance */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><WalletCards size={15} className="text-[#e9c349]" /> Фінанси</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/5 p-3">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#b9a35b]">Клієнт платить</div>
                <div className="grid gap-1.5">
                  <Row label="Повна ціна" value={eur(booking.price)} strong />
                  {Number(booking.discountPercent || 0) > 0 && <Row label="Знижка" value={`−${Number(booking.discountPercent).toFixed(0)}% (${eur(booking.discountAmount)})`} />}
                  {Number(booking.surcharges || 0) > 0 && <Row label="Опції в ціні" value={eur(booking.surcharges)} />}
                  <Row label="Завдаток" value={eur(deposit)} />
                  <Row label="Оплачено" value={`${eur(paid)}${booking.invoice?.paidAt ? ` (${new Date(booking.invoice.paidAt).toLocaleDateString('uk-UA')})` : ''}`} />
                  <Row label="Залишок" value={remaining === 0 ? 'Оплачено' : eur(remaining)} strong />
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8a8a93]">Видатки (собівартість)</div>
                <div className="grid gap-1.5">
                  <Row label="Пальне / зарядка" value={eur(booking.fuelCost)} />
                  <Row label="ЗП водію" value={eur(booking.driverSalary)} />
                  <Row label="Подача авто" value={eur(booking.deliveryCost)} />
                  <Row label="Амортизація" value={eur(booking.amortization)} />
                  {Number(booking.hotelCost || 0) > 0 && <Row label="Готель водія" value={eur(booking.hotelCost)} />}
                  <Row label="Разом" value={eur(internal)} strong />
                  <Row label="Прибуток" value={eur(profitOf(booking))} strong />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 p-4">
          <span className="text-xs text-[#8a8a93]">Редагування часу, водія, ціни і оплат — у «Заявки і календар».</span>
          <a href="/admin/bookings" className="rounded-lg bg-[#e9c349] px-4 py-2 text-sm font-bold text-black">Керувати рейсом</a>
        </div>
      </div>
    </div>
  );
}

export default function BookingCard({ booking, compact = false }: { booking: DashboardBooking; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const expenses = expensesOf(booking);
  const profit = profitOf(booking);
  const carName = `${booking.car.make} ${booking.car.model}`;
  const driverName = booking.driver?.user?.name || 'Водій не призначений';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl border border-white/10 bg-[#17171f] p-4 text-left transition hover:border-[#e9c349]/35">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass[booking.status] || statusClass.PENDING}`}>
                {statusLabel[booking.status] || booking.status}
              </span>
              <span className="text-sm text-[#a7a6ad]">#{booking.id.slice(0, 8)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xl font-black text-white">
              <span>{shortPlace(booking.routeFrom)}</span>
              <ArrowRight size={18} className="text-[#e9c349]" />
              <span>{shortPlace(booking.routeTo)}</span>
            </div>
            <div className="mt-2 grid gap-2 text-sm text-[#c7c6ca] md:grid-cols-2">
              <span className="flex items-center gap-2 font-bold text-white">
                <UserRound size={15} className="text-[#e9c349]" />
                {booking.client.name}{booking.client.phone ? `, ${booking.client.phone}` : ''}
              </span>
              <span className="flex items-center gap-2">
                <CalendarClock size={15} className="text-[#e9c349]" />
                {dt(booking.dateStart)}
              </span>
              <span className="flex items-center gap-2">
                <Car size={15} className="text-[#e9c349]" />
                {carName}
              </span>
              <span className="flex items-center gap-2">
                <UserRoundCheck size={15} className="text-[#e9c349]" />
                {driverName}
              </span>
              <span className="flex items-center gap-2">
                <Users size={15} className="text-[#e9c349]" />
                {booking.passengers} дор. / {booking.children} дит.
              </span>
            </div>
            {!compact && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#a7a6ad]">
                <span className="rounded-lg bg-black/20 px-2.5 py-1">маршрут: {km(booking.distance)}</span>
                <span className="rounded-lg bg-black/20 px-2.5 py-1">подача: {km(booking.deliveryDistance)}</span>
                <span className="rounded-lg bg-black/20 px-2.5 py-1">валізи: {booking.luggage}</span>
                <span className="rounded-lg bg-black/20 px-2.5 py-1">тварини: {booking.petsCount || 0}</span>
              </div>
            )}
          </div>
          <div className="grid min-w-[148px] grid-cols-3 gap-2 text-right lg:block">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[#8a8a93]">ціна</div>
              <div className="text-xl font-black text-[#e9c349]">{eur(booking.price)}</div>
            </div>
            <div className="lg:mt-2">
              <div className="text-xs uppercase tracking-[0.14em] text-[#8a8a93]">витрати</div>
              <div className="font-bold text-red-200">{eur(expenses)}</div>
            </div>
            <div className="lg:mt-2">
              <div className="text-xs uppercase tracking-[0.14em] text-[#8a8a93]">прибуток</div>
              <div className="font-bold text-emerald-300">{eur(profit)}</div>
            </div>
          </div>
        </div>
      </button>
      {open && <DetailsModal booking={booking} onClose={() => setOpen(false)} />}
    </>
  );
}
