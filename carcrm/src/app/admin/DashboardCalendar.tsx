'use client';

import React, { useState } from 'react';

type Car = {
  id: string;
  make: string;
  model: string;
};

type Booking = {
  id: string;
  carId: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  dateEnd: string;
  client: { name: string, phone: string | null };
  driver?: { user: { name: string } } | null;
  status: string;
  price: number;
  fuelCost?: number | null;
  driverSalary?: number | null;
  netProfit?: number | null;
};

export default function DashboardCalendar({ cars, bookings }: { cars: Car[], bookings: Booking[] }) {
  const [selectedCarId, setSelectedCarId] = useState<string>(cars.length > 0 ? cars[0].id : '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = getDaysInMonth(year, month);
  let firstDay = getFirstDayOfMonth(year, month);
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Make Monday 0, Sunday 6

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getBookingForDay = (dayNum: number) => {
    if (!selectedCarId) return null;
    const targetDate = new Date(year, month, dayNum, 12, 0, 0); // Noon to avoid timezone shifts
    return bookings.find(b => {
      const bStart = new Date(b.dateStart);
      const bEnd = new Date(b.dateEnd);
      bStart.setHours(0,0,0,0);
      bEnd.setHours(23,59,59,999);
      return b.carId === selectedCarId && targetDate >= bStart && targetDate <= bEnd;
    });
  };

  const monthNames = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
  ];

  return (
    <div className="flex flex-col gap-6 mt-6">
      
      {/* Car Selector */}
      <div className="flex gap-3 flex-wrap">
        {cars.map(car => (
          <button
            key={car.id}
            onClick={() => setSelectedCarId(car.id)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              selectedCarId === car.id 
                ? 'bg-[#e9c349] text-black shadow-[0_0_15px_rgba(233,195,73,0.3)] scale-105' 
                : 'glass-panel text-white hover:border-[#e9c349] hover:bg-white/10'
            }`}
          >
            {car.make} {car.model}
          </button>
        ))}
      </div>

      {/* Classic Monthly Calendar */}
      {selectedCarId && (
        <div className="glass-panel rounded-2xl overflow-hidden p-6 animate-fade-in">
          
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="px-4 py-2 bg-[#13131a] border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">&larr; Попередній</button>
            <h2 className="text-2xl font-bold text-white m-0">{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} className="px-4 py-2 bg-[#13131a] border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">Наступний &rarr;</button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
              <div key={d} className="text-center text-[#8a8a93] font-bold uppercase text-xs py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for start of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-transparent" />
            ))}
            
            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const booking = getBookingForDay(dayNum);
              const isStartDay = booking && new Date(booking.dateStart).getDate() === dayNum;
              
              return (
                <div 
                  key={dayNum} 
                  onClick={() => {
                    if (booking) setSelectedBooking(booking);
                    else alert(`Вільна дата: ${dayNum} ${monthNames[month]}. Створення нової броні в розробці.`);
                  }}
                  className={`min-h-[100px] rounded-xl p-2 cursor-pointer relative transition-all duration-300 group ${
                    booking 
                      ? 'bg-[#e9c349]/10 border border-[#e9c349]/40 hover:bg-[#e9c349]/20 shadow-[0_0_10px_rgba(233,195,73,0.1)]' 
                      : 'bg-[#13131a] border border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className={`font-bold text-lg ${booking ? 'text-[#e9c349]' : 'text-white group-hover:text-[#e9c349] transition-colors'}`}>{dayNum}</div>
                  
                  {booking && (
                    <div className={`mt-2 px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis ${
                      isStartDay ? 'bg-[#e9c349] text-black shadow-md' : 'bg-[#e9c349]/20 text-[#e9c349]'
                    }`}>
                      {isStartDay ? `${booking.routeFrom.split(',')[0]} ➔ ${booking.routeTo.split(',')[0]}` : 'Рейс триває'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
          <div className="glass-panel rounded-2xl border border-[#e9c349]/50 w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-[#e9c349] text-2xl font-bold mb-1">Деталі Поїздки</h2>
                  <p className="text-[#8a8a93] text-sm m-0">ID: {selectedBooking.id.substring(0,8)}... | Статус: {selectedBooking.status}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-[#8a8a93] hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="bg-[#13131a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="m-0 mb-2 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Клієнт</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9c349]/20 flex items-center justify-center text-[#e9c349]">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="m-0 text-white font-bold text-lg">{selectedBooking.client.name}</p>
                    <p className="m-0 text-[#c7c6ca]">{selectedBooking.client.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#13131a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="m-0 mb-2 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Маршрут та Дати</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#e9c349]">route</span>
                  <p className="m-0 text-white font-bold text-lg">{selectedBooking.routeFrom} &rarr; {selectedBooking.routeTo}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#e9c349]">calendar_month</span>
                  <p className="m-0 text-[#e9c349] font-medium">
                    {new Date(selectedBooking.dateStart).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} 
                    &nbsp;&mdash;&nbsp; 
                    {new Date(selectedBooking.dateEnd).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#13131a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <p className="m-0 mb-2 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Призначений Водій</p>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#e9c349]">badge</span>
                    <p className={`m-0 font-bold text-lg ${selectedBooking.driver ? 'text-white' : 'text-red-400'}`}>
                      {selectedBooking.driver ? selectedBooking.driver.user.name : 'Не призначено'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#13131a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <p className="m-0 mb-3 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Фінанси</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                      <span className="text-[#c7c6ca]">Сума клієнта:</span> 
                      <strong className="text-white text-base">€{selectedBooking.price}</strong>
                    </div>
                    {selectedBooking.netProfit !== undefined && selectedBooking.netProfit !== null && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#c7c6ca]">Чиста маржа:</span> 
                        <strong className="text-green-400 text-base">€{selectedBooking.netProfit}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5">
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="w-full py-4 glass-panel hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
