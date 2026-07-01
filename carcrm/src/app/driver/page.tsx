"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";

type Booking = {
  id: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  price: number;
  status: string;
  driverNotes?: string;
  client: { name: string; phone: string };
  car: { make: string; model: string };
};

export default function DriverPortal() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{ bookings: Booking[], stats: any, user: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchData();
    }
  }, [authStatus, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/driver/bookings");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("Доступ заборонено або сталася помилка");
      }
    } catch (err) {
      setError("Помилка підключення");
    }
    setLoading(false);
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (authStatus === "loading" || loading) return <div className="p-8 text-white min-h-screen bg-[#0a0a0a]">Завантаження...</div>;
  if (error || !data) return <div className="p-8 text-red-400 min-h-screen bg-[#0a0a0a]">{error}</div>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 pb-16 px-4 font-sans text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Кабінет Водія</h1>
            <p className="text-gray-400">Вітаємо, {data.user.name}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm px-4 py-2 border border-white/20 rounded-xl hover:bg-white/10 transition">Вийти</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Всього поїздок</h3>
            <div className="text-4xl font-light text-white">{data.stats.total}</div>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Виконано</h3>
            <div className="text-4xl font-light text-green-400">{data.stats.completed}</div>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Зарплатна ставка</h3>
            <div className="text-4xl font-light text-[#e9c349]">€{data.stats.salaryRate}</div>
          </div>
        </div>

        {/* Bookings */}
        <h2 className="text-xl font-bold mb-6 text-white">Призначені поїздки</h2>
        <div className="space-y-6">
          {data.bookings.map(b => (
            <div key={b.id} className="bg-white/5 p-6 rounded-2xl border border-[#e9c349]/20 flex flex-col md:flex-row justify-between gap-6 backdrop-blur-sm shadow-xl">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-[#e9c349] font-bold text-lg">{format(new Date(b.dateStart), "dd MMMM yyyy, HH:mm", { locale: uk })}</div>
                  <div className={`px-2 py-1 text-xs font-bold rounded uppercase ${b.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {b.status}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-500 block mb-1">Маршрут:</span>
                    <span className="font-medium text-white">{b.routeFrom} ➔ {b.routeTo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Клієнт:</span>
                    <span className="font-medium text-white">{b.client.name}</span> ({b.client.phone})
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Авто:</span>
                    <span className="font-medium text-white">{b.car.make} {b.car.model}</span>
                  </div>
                </div>
                
                {b.driverNotes && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm">
                    <strong>Вказівки адміна:</strong> {b.driverNotes}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                {/* Status Update Actions */}
                {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                  <>
                    <button onClick={() => updateBookingStatus(b.id, 'COMPLETED')} className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-bold transition">
                      Позначити як Виконано
                    </button>
                  </>
                )}
                {/* Chat button */}
                <button 
                  onClick={() => setActiveChatBookingId(b.id)}
                  className="w-full py-3 bg-[#e9c349]/10 hover:bg-[#e9c349]/20 text-[#e9c349] rounded-xl text-sm font-bold transition flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">chat</span> Відкрити чат
                </button>
              </div>
            </div>
          ))}
          {data.bookings.length === 0 && (
            <div className="text-center text-gray-500 py-12 bg-white/5 rounded-2xl border border-white/5">Немає призначених поїздок</div>
          )}
        </div>
      </div>
      
      {activeChatBookingId && data.user && (
        <ChatWidget 
          bookingId={activeChatBookingId} 
          currentUserId={data.user.id} 
          onClose={() => setActiveChatBookingId(null)} 
        />
      )}
    </main>
  );
}
