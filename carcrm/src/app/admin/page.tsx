import { endOfMonth, format, startOfDay, startOfMonth, subDays } from 'date-fns';
import { uk } from 'date-fns/locale/uk';
import {
  AlertTriangle,
  CalendarClock,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gauge,
  Inbox,
  Luggage,
  MessageSquare,
  Route,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import BookingCard, { type DashboardBooking } from '@/components/admin/BookingCard';
import { BOOKING_STATUS_LABEL as statusLabel, money as eur, shortPlace } from '@/lib/format';

export const dynamic = 'force-dynamic';

function tripTime(value: Date) {
  return format(value, 'dd MMM, HH:mm', { locale: uk });
}

function calcExpenses(booking: {
  fuelCost?: number | null;
  driverSalary?: number | null;
  deliveryCost?: number | null;
  amortization?: number | null;
  timeCost?: number | null;
  hotelCost?: number | null;
  surcharges?: number | null;
}) {
  return (
    Number(booking.fuelCost || 0) +
    Number(booking.driverSalary || 0) +
    Number(booking.deliveryCost || 0) +
    Number(booking.amortization || 0) +
    Number(booking.timeCost || 0) +
    Number(booking.hotelCost || 0) +
    Number(booking.surcharges || 0)
  );
}

function calcProfit(booking: { price: number; netProfit?: number | null } & Parameters<typeof calcExpenses>[0]) {
  if (booking.netProfit !== null && booking.netProfit !== undefined) return Number(booking.netProfit);
  return Number(booking.price || 0) - calcExpenses(booking);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/20 bg-emerald-400/5'
      : tone === 'red'
        ? 'border-red-400/20 bg-red-400/5'
        : tone === 'gold'
          ? 'border-[#e9c349]/30 bg-[#e9c349]/10'
          : 'border-white/10 bg-[#15151d]';

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a93]">{label}</span>
        <Icon className={tone === 'green' ? 'text-emerald-300' : tone === 'red' ? 'text-red-300' : 'text-[#e9c349]'} size={20} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-[#a7a6ad]">{hint}</div>
    </div>
  );
}

// Booking rows are rendered by the clickable BookingCard (opens the details modal with map)
function toPlain(booking: unknown): DashboardBooking {
  return JSON.parse(JSON.stringify(booking)) as DashboardBooking;
}

function ChatRow({ chat }: { chat: Awaited<ReturnType<typeof getDashboardData>>['unansweredChats'][number] }) {
  const lastMessage = chat.messages[0];
  const clientName = chat.clientName || chat.clientPhone || chat.booking?.client?.name || chat.externalId || 'Клієнт';
  const route = chat.booking ? `${shortPlace(chat.booking.routeFrom)} -> ${shortPlace(chat.booking.routeTo)}` : 'Без привʼязаного рейсу';

  return (
    <a
      href="/admin/chat"
      className="block rounded-xl border border-red-400/20 bg-red-400/5 p-4 transition hover:border-red-300/45"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-red-300/30 bg-red-300/10 px-2.5 py-1 text-xs font-bold text-red-200">
              Без відповіді
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8a93]">{chat.platform}</span>
          </div>
          <div className="mt-2 truncate font-black text-white">{clientName}</div>
          <div className="mt-1 text-sm text-[#a7a6ad]">{route}</div>
          <div className="mt-2 line-clamp-2 text-sm text-[#c7c6ca]">{lastMessage?.content || 'Файл або зображення'}</div>
        </div>
        <div className="shrink-0 text-right text-xs text-[#8a8a93]">
          {lastMessage ? tripTime(lastMessage.createdAt) : tripTime(chat.updatedAt)}
        </div>
      </div>
    </a>
  );
}

async function getDashboardData() {
  const now = new Date();
  const today = startOfDay(now);
  const nextTwoWeeks = new Date(today);
  nextTwoWeeks.setDate(today.getDate() + 14);
  const weekAgo = subDays(today, 7);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const include = {
    car: true,
    client: true,
    driver: { include: { user: true } },
    invoice: true,
  };

  const [futureBookings, activeBookings, closedBookings, monthBookings, openRequests, rawChats, cars, drivers] = await Promise.all([
    prisma.booking.findMany({
      where: {
        dateStart: { gte: now },
        status: { not: 'CANCELLED' },
      },
      include,
      orderBy: { dateStart: 'asc' },
      take: 8,
    }),
    prisma.booking.findMany({
      where: {
        dateStart: { lte: now },
        dateEnd: { gte: now },
        status: { not: 'CANCELLED' },
      },
      include,
      orderBy: { dateStart: 'asc' },
      take: 6,
    }),
    prisma.booking.findMany({
      where: {
        dateEnd: { gte: weekAgo, lt: now },
        status: 'COMPLETED',
      },
      include,
      orderBy: { dateEnd: 'desc' },
      take: 6,
    }),
    prisma.booking.findMany({
      where: {
        dateStart: { gte: monthStart, lte: monthEnd },
        status: { not: 'CANCELLED' },
      },
      include,
      orderBy: { dateStart: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: 'PENDING',
      },
      include,
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.chatRoom.findMany({
      include: {
        booking: { include: { client: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }),
    prisma.car.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] }),
    prisma.driver.findMany({ include: { user: true }, orderBy: { user: { name: 'asc' } } }),
  ]);

  const upcomingTwoWeeks = monthBookings.filter((booking) => booking.dateStart >= today && booking.dateStart <= nextTwoWeeks);
  const unansweredChats = rawChats.filter((chat) => chat.messages[0] && !chat.messages[0].isFromAdmin).slice(0, 6);

  return {
    futureBookings,
    activeBookings,
    closedBookings,
    monthBookings,
    upcomingTwoWeeks,
    openRequests,
    unansweredChats,
    cars,
    drivers,
  };
}

export default async function AdminDashboardPage() {
  const { futureBookings, activeBookings, closedBookings, monthBookings, upcomingTwoWeeks, openRequests, unansweredChats, cars, drivers } = await getDashboardData();

  const monthRevenue = monthBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  const monthExpenses = monthBookings.reduce((sum, booking) => sum + calcExpenses(booking), 0);
  const monthProfit = monthBookings.reduce((sum, booking) => sum + calcProfit(booking), 0);
  const unassignedBookings = futureBookings.filter((booking) => !booking.driverId).length;
  const availableCars = cars.filter((car) => car.status === 'AVAILABLE').length;
  const activeDrivers = drivers.filter((driver) => driver.status === 'ACTIVE').length;
  const statusCounts = monthBookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const nextTrip = futureBookings[0];

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-white/10 bg-[#13131a] p-5 shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#e9c349]">
              <Gauge size={18} />
              Операційний центр
            </div>
            <h1 className="text-2xl font-black text-white md:text-3xl">Дашборд рейсів, авто і фінансів</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a7a6ad]">
              Тут видно що скоро їде, що вже в дорозі, що закрито за тиждень, скільки заробили цього місяця і де потрібна увага адміністратора.
            </p>
          </div>
          {nextTrip && (
            <div className="rounded-xl border border-[#e9c349]/25 bg-[#e9c349]/10 p-4 xl:min-w-[360px]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9c349]">Найближчий рейс</div>
              <div className="mt-2 text-lg font-black text-white">
                {shortPlace(nextTrip.routeFrom)} -&gt; {shortPlace(nextTrip.routeTo)}
              </div>
              <div className="mt-1 text-sm text-[#c7c6ca]">
                {tripTime(nextTrip.dateStart)} · {nextTrip.car.make} {nextTrip.car.model}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={CalendarClock} label="Майбутні рейси" value={`${futureBookings.length}`} hint="найближчі бронювання у черзі" tone="gold" />
        <MetricCard icon={Clock3} label="У дорозі" value={`${activeBookings.length}`} hint="активні рейси прямо зараз" />
        <MetricCard icon={Inbox} label="Нові заявки" value={`${openRequests.length}`} hint="відкриті, ще не підтверджені" tone={openRequests.length ? 'red' : 'default'} />
        <MetricCard icon={MessageSquare} label="Чати" value={`${unansweredChats.length}`} hint="останнє повідомлення від клієнта" tone={unansweredChats.length ? 'red' : 'default'} />
        <MetricCard icon={CircleDollarSign} label="Дохід місяця" value={eur(monthRevenue)} hint={`витрати ${eur(monthExpenses)}`} tone="green" />
        <MetricCard icon={TrendingUp} label="Прибуток" value={eur(monthProfit)} hint="після пального, водія і подачі" tone={monthProfit < 0 ? 'red' : 'green'} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-xl border border-white/10 bg-[#10101a]">
            <div className="flex flex-col gap-2 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <Route className="text-[#e9c349]" size={22} />
                  Найближчі рейси
                </h2>
                <p className="mt-1 text-sm text-[#8a8a93]">Список для швидкого контролю без дублювання календаря.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-[#c7c6ca]">
                14 днів: {upcomingTwoWeeks.length}
              </span>
            </div>
            <div className="grid gap-3 p-4">
              {futureBookings.length > 0 ? (
                futureBookings.map((booking) => <BookingCard key={booking.id} booking={toPlain(booking)} />)
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-[#a7a6ad]">
                  Майбутніх рейсів немає. Коли клієнт створить бронювання, воно з'явиться тут.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#10101a]">
            <div className="flex flex-col gap-2 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <CheckCircle2 className="text-emerald-300" size={22} />
                  Закриті за 7 днів
                </h2>
                <p className="mt-1 text-sm text-[#8a8a93]">Завершені рейси для контролю оплат, витрат і фактичного прибутку.</p>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {closedBookings.length > 0 ? (
                closedBookings.map((booking) => <BookingCard key={booking.id} booking={toPlain(booking)} compact />)
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-[#a7a6ad] md:col-span-2">
                  За останні 7 днів немає закритих рейсів.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <div className="rounded-xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <AlertTriangle className="text-[#e9c349]" size={22} />
              Потребує уваги
            </h2>
            <div className="mt-4 grid gap-3">
              <a href="/admin/bookings" className={`rounded-xl border p-4 transition ${unassignedBookings > 0 ? 'border-red-400/20 bg-red-400/5 hover:border-red-300/45' : 'border-white/10 bg-[#17171f] hover:border-white/25'}`}>
                <div className="text-2xl font-black text-white">{unassignedBookings}</div>
                <div className="text-sm text-[#a7a6ad]">майбутніх рейсів без водія</div>
              </a>
              <a href="/admin/bookings" className={`rounded-xl border p-4 transition ${openRequests.length > 0 ? 'border-red-400/20 bg-red-400/5 hover:border-red-300/45' : 'border-white/10 bg-[#17171f] hover:border-white/25'}`}>
                <div className="text-2xl font-black text-white">{openRequests.length}</div>
                <div className="text-sm text-[#a7a6ad]">відкритих заявок без підтвердження</div>
              </a>
              <a href="/admin/chat" className={`rounded-xl border p-4 transition ${unansweredChats.length > 0 ? 'border-red-400/20 bg-red-400/5 hover:border-red-300/45' : 'border-white/10 bg-[#17171f] hover:border-white/25'}`}>
                <div className="text-2xl font-black text-white">{unansweredChats.length}</div>
                <div className="text-sm text-[#a7a6ad]">чатів очікують відповідь</div>
              </a>
              <a href="/admin/fleet" className="rounded-xl border border-white/10 bg-[#17171f] p-4 transition hover:border-white/25">
                <div className="text-2xl font-black text-white">{availableCars} / {cars.length}</div>
                <div className="text-sm text-[#a7a6ad]">авто доступні в автопарку</div>
              </a>
              <a href="/admin/users" className="rounded-xl border border-white/10 bg-[#17171f] p-4 transition hover:border-white/25">
                <div className="text-2xl font-black text-white">{activeDrivers} / {drivers.length}</div>
                <div className="text-sm text-[#a7a6ad]">активні водії</div>
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <MessageSquare className="text-[#e9c349]" size={22} />
              Чати без відповіді
            </h2>
            <p className="mt-1 text-sm text-[#8a8a93]">Діалоги, де останнє повідомлення прийшло від клієнта або месенджера.</p>
            <div className="mt-4 grid gap-3">
              {unansweredChats.length > 0 ? (
                unansweredChats.map((chat) => <ChatRow key={chat.id} chat={chat} />)
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-[#a7a6ad]">Немає чатів, які чекають відповідь.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <WalletCards className="text-[#e9c349]" size={22} />
              Статуси місяця
            </h2>
            <div className="mt-4 grid gap-2">
              {Object.entries(statusLabel).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
                  <span className="text-sm text-[#c7c6ca]">{label}</span>
                  <span className="font-black text-white">{statusCounts[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Car className="text-[#e9c349]" size={22} />
              Автопарк
            </h2>
            <div className="mt-4 grid gap-2">
              {cars.slice(0, 6).map((car) => (
                <div key={car.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">{car.make} {car.model}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-[#8a8a93]">
                      <span>{car.comfortClass}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{car.capacity}</span>
                      <span className="flex items-center gap-1"><Luggage size={12} />{car.luggageCapacity}</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-black/20 px-2 py-1 text-xs font-bold text-[#e9c349]">{car.status}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
