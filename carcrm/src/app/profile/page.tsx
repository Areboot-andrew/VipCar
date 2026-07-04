"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import ChatWidget from "@/components/ChatWidget";

type Invoice = {
  id: string;
  status: string;
  amount?: number;
  depositAmount?: number;
  paidAmount?: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
};

type Booking = {
  id: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  price: number;
  status: string;
  discountPercent?: number;
  discountAmount?: number;
  invoice?: Invoice | null;
  car?: { make: string; model: string; year?: number; comfortClass?: string } | null;
  driver?: { user?: { name: string; phone?: string | null } | null } | null;
};

const paymentMethodLabel = (method?: string | null) => {
  switch (method) {
    case "CASH": return "готівка";
    case "CARD": return "карта";
    case "USDT": return "USDT";
    case "BANK": return "банк. переказ";
    default: return method || "";
  }
};

const money = (value?: number | null) => `€${Math.round(Number(value || 0)).toLocaleString("uk-UA")}`;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalDiscount, setPersonalDiscount] = useState(0);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBookings();
      fetch("/api/user/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setPersonalDiscount(Number(data.personalDiscountPercent || 0)))
        .catch(() => {});
    }
  }, [status, router]);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/user/bookings");
      const data = await res.json();
      if (res.ok) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Помилка завантаження бронювань:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-400 bg-yellow-400/10";
      case "CONFIRMED": return "text-green-400 bg-green-400/10";
      case "COMPLETED": return "text-blue-400 bg-blue-400/10";
      case "CANCELLED": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "В обробці";
      case "CONFIRMED": return "Підтверджено";
      case "COMPLETED": return "Виконано";
      case "CANCELLED": return "Скасовано";
      default: return status;
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-[#e9c349]">Завантаження...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Особистий кабінет</h1>
            <p className="text-gray-400">
              Вітаємо, <span className="text-white font-medium">{session?.user?.name}</span>!
            </p>
          </div>
          
          <div className="flex gap-4">
            {(session?.user as any)?.role === "ADMIN" && (
              <Link href="/admin" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                Адмін-панель
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-6 py-2 border border-white/20 hover:border-white/40 text-white rounded-xl transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>

        {personalDiscount > 0 && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#e9c349]/30 bg-[#e9c349]/10 p-5">
            <span className="material-symbols-outlined text-[#e9c349]">loyalty</span>
            <div>
              <div className="font-bold text-white">Ваша персональна знижка −{personalDiscount}%</div>
              <div className="text-sm text-[#c7c6ca]">Коли ви залогінені, на сайті у калькуляторі показується «ваша ціна» вже зі знижкою.</div>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <h2 className="text-xl text-white mb-6">Історія поїздок</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">У вас ще немає замовлень.</p>
              <Link href="/#calculator" className="text-[#e9c349] hover:underline">
                Забронювати першу поїздку
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const invoice = booking.invoice;
                const paid = Number(invoice?.paidAmount || 0);
                const deposit = Number(invoice?.depositAmount || 0);
                const remaining = Math.max(0, Math.round(Number(booking.price || 0) - paid));
                const isPaid = invoice?.status === "PAID" || remaining === 0;
                return (
                <div key={booking.id} className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">
                        {format(new Date(booking.dateStart), "dd MMMM yyyy, HH:mm", { locale: uk })}
                      </div>
                      <div className="text-white flex items-center gap-2">
                        <span className="truncate max-w-[150px] md:max-w-[300px]">{booking.routeFrom}</span>
                        <span className="text-[#e9c349] material-symbols-outlined text-sm">arrow_forward</span>
                        <span className="truncate max-w-[150px] md:max-w-[300px]">{booking.routeTo}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
                        {booking.car && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[#e9c349]">directions_car</span>
                            {booking.car.make} {booking.car.model}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#e9c349]">person</span>
                          Водій: {booking.driver?.user?.name ? (
                            <span className="text-white">{booking.driver.user.name}</span>
                          ) : (
                            <span>буде призначений</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border border-current self-start ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">Повна ціна</div>
                      <div className="text-lg text-white font-medium">{money(booking.price)}</div>
                      {Number(booking.discountPercent || 0) > 0 && (
                        <div className="text-xs text-[#e9c349]">знижка −{booking.discountPercent}% ({money(booking.discountAmount)})</div>
                      )}
                    </div>
                    <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">Завдаток</div>
                      <div className="text-lg text-white font-medium">{money(deposit)}</div>
                      <div className="text-xs text-gray-500">передоплата</div>
                    </div>
                    <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">Оплачено</div>
                      <div className={`text-lg font-medium ${paid > 0 ? "text-green-400" : "text-white"}`}>{money(paid)}</div>
                      {paid > 0 && invoice?.paidAt ? (
                        <div className="text-xs text-gray-500">
                          {format(new Date(invoice.paidAt), "dd.MM.yyyy", { locale: uk })}
                          {invoice.paymentMethod ? ` • ${paymentMethodLabel(invoice.paymentMethod)}` : ""}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">ще не оплачено</div>
                      )}
                    </div>
                    <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-gray-500">Залишок</div>
                      <div className={`text-lg font-medium ${isPaid ? "text-green-400" : "text-[#e9c349]"}`}>{isPaid ? "Оплачено" : money(remaining)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 border-t border-white/5 pt-3">
                    <button onClick={() => setActiveChatBookingId(booking.id)} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">chat</span> Чат підтримки
                    </button>
                    {invoice && (
                      <Link href={`/invoice/${invoice.id}`} target="_blank" className="text-xs text-[#e9c349] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">receipt</span> Рахунок {isPaid ? "(Оплачено)" : "(Не оплачено)"}
                      </Link>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {activeChatBookingId && session?.user && (
        <ChatWidget 
          bookingId={activeChatBookingId} 
          currentUserId={(session.user as any).id || ""} 
          onClose={() => setActiveChatBookingId(null)} 
        />
      )}
    </main>
  );
}
