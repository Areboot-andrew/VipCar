"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

type Booking = {
  id: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  price: number;
  status: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBookings();
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
              {bookings.map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">
                      {format(new Date(booking.dateStart), "dd MMMM yyyy, HH:mm", { locale: uk })}
                    </div>
                    <div className="text-white flex items-center gap-2">
                      <span className="truncate max-w-[150px] md:max-w-[300px]">{booking.routeFrom}</span>
                      <span className="text-[#e9c349] material-symbols-outlined text-sm">arrow_forward</span>
                      <span className="truncate max-w-[150px] md:max-w-[300px]">{booking.routeTo}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Вартість</div>
                      <div className="text-lg text-white font-medium">€{booking.price}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border border-current ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
