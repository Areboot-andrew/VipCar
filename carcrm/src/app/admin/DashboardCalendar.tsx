'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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
  status: string;
};

export default function DashboardCalendar({ cars, bookings }: { cars: Car[], bookings: Booking[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
  ];

  // Helper to determine if a booking spans a specific day
  const getBookingStyles = (booking: Booking, dayNum: number) => {
    const start = new Date(booking.dateStart);
    const end = new Date(booking.dateEnd);
    
    // Normalize to start of day for comparison
    const currentDay = new Date(year, month, dayNum);
    const currentDayEnd = new Date(year, month, dayNum, 23, 59, 59);

    if (end < currentDay || start > currentDayEnd) return null; // Not in this day

    const isStart = start.getDate() === dayNum && start.getMonth() === month && start.getFullYear() === year;
    const isEnd = end.getDate() === dayNum && end.getMonth() === month && end.getFullYear() === year;
    
    let radiusClass = "";
    if (isStart && isEnd) radiusClass = "rounded-lg mx-1";
    else if (isStart) radiusClass = "rounded-l-lg ml-1";
    else if (isEnd) radiusClass = "rounded-r-lg mr-1";
    else radiusClass = "";

    let colorClass = "bg-[#e9c349]/20 border-y border-[#e9c349]/50 text-[#e9c349]";
    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        colorClass = "bg-[#e9c349] border-[#e9c349] text-black shadow-md z-10";
    }

    return { radiusClass, colorClass, isStart, isEnd };
  };

  return (
    <div className="bg-[#13131a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
      
      {/* Timeline Header */}
      <div className="p-4 md:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#080818]">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-[#e9c349]" size={24} />
          <h2 className="text-xl md:text-2xl font-bold text-white m-0">Флот-Календар (Gantt)</h2>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={prevMonth} className="p-2 text-[#c7c6ca] hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="w-32 text-center font-bold text-white uppercase tracking-wider text-sm">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 text-[#c7c6ca] hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Timeline Grid (Scrollable horizontally on small screens) */}
      <div className="overflow-x-auto w-full">
        <div className="min-w-[800px]">
          
          {/* Days Header */}
          <div className="flex border-b border-white/5 bg-[#1a1a24]">
            <div className="w-48 shrink-0 p-4 border-r border-white/5 text-xs text-[#8a8a93] uppercase font-bold tracking-widest sticky left-0 bg-[#1a1a24] z-20 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
              Автомобіль
            </div>
            <div className="flex-1 flex">
              {daysArray.map(day => (
                <div key={day} className="flex-1 text-center py-3 text-xs font-bold text-[#c7c6ca] border-r border-white/5 last:border-0 relative">
                  {day}
                  {/* Highlight today */}
                  {day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() && (
                    <div className="absolute top-1 right-1/2 translate-x-1/2 w-1.5 h-1.5 bg-[#e9c349] rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cars Rows */}
          <div className="flex flex-col relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex ml-48 z-0 pointer-events-none">
                {daysArray.map(day => (
                    <div key={`grid-${day}`} className="flex-1 border-r border-white/5 last:border-0 h-full"></div>
                ))}
            </div>

            {cars.map((car) => {
              // Filter bookings for this car in this month
              const carBookings = bookings.filter(b => b.carId === car.id && b.status !== 'CANCELLED');
              
              return (
                <div key={car.id} className="flex border-b border-white/5 hover:bg-white/5 transition-colors relative z-10 group">
                  
                  {/* Car Name Sidebar */}
                  <div className="w-48 shrink-0 p-4 border-r border-white/5 flex items-center sticky left-0 bg-[#13131a] group-hover:bg-[#1a1a24] transition-colors z-20 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
                    <div>
                      <div className="text-white font-bold text-sm leading-tight">{car.make}</div>
                      <div className="text-[#e9c349] text-xs font-semibold">{car.model}</div>
                    </div>
                  </div>

                  {/* Days Timeline */}
                  <div className="flex-1 flex relative py-2">
                    {daysArray.map(dayNum => {
                      // Find if any booking intersects this day
                      const dayBooking = carBookings.find(b => getBookingStyles(b, dayNum) !== null);
                      const styles = dayBooking ? getBookingStyles(dayBooking, dayNum) : null;

                      return (
                        <div key={`${car.id}-${dayNum}`} onClick={() => dayBooking && setSelectedBooking(dayBooking)} className="flex-1 relative flex items-center justify-center min-h-[40px] group/cell cursor-pointer">
                          {styles && dayBooking && (
                            <div 
                              className={`absolute inset-0 my-1 ${styles.radiusClass} ${styles.colorClass} flex items-center overflow-hidden transition-all hover:brightness-110`}
                              title={`${dayBooking.client.name} | ${dayBooking.routeFrom} -> ${dayBooking.routeTo}`}
                            >
                              {styles.isStart && (
                                <div className="px-2 text-[10px] font-bold whitespace-nowrap truncate w-full">
                                  {dayBooking.client.name.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Hover effect for empty cells */}
                          {!dayBooking && (
                              <div className="absolute inset-1 rounded bg-white/0 group-hover/cell:bg-white/10 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all">
                                  <span className="material-symbols-outlined text-[#8a8a93] text-sm">add</span>
                              </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-[#080818] border-t border-white/10 flex gap-6 text-xs text-[#8a8a93] uppercase font-bold tracking-wider justify-center sm:justify-start">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#e9c349]"></div>
              Підтверджені рейси
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#e9c349]/20 border border-[#e9c349]/50"></div>
              Очікують підтвердження
          </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
          <div className="glass-panel rounded-2xl border border-[#e9c349]/50 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-[#e9c349] text-xl font-bold mb-1">Деталі Поїздки</h2>
                <p className="text-[#8a8a93] text-sm m-0">Статус: {selectedBooking.status}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-[#8a8a93] hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-[#13131a] p-4 rounded-xl border border-white/5">
                <p className="m-0 mb-2 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Клієнт</p>
                <p className="m-0 text-white font-bold text-lg">{selectedBooking.client.name}</p>
                <p className="m-0 text-[#c7c6ca]">{selectedBooking.client.phone}</p>
              </div>

              <div className="bg-[#13131a] p-4 rounded-xl border border-white/5">
                <p className="m-0 mb-2 text-[#8a8a93] text-xs uppercase tracking-wider font-bold">Маршрут</p>
                <p className="m-0 text-white font-bold">{selectedBooking.routeFrom} &rarr; {selectedBooking.routeTo}</p>
                <p className="m-0 text-[#e9c349] font-medium mt-2">
                  {new Date(selectedBooking.dateStart).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} 
                  &nbsp;&mdash;&nbsp; 
                  {new Date(selectedBooking.dateEnd).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
