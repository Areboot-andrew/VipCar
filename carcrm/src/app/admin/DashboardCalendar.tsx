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
  fuelCost?: number;
  driverSalary?: number;
  netProfit?: number;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
      
      {/* Car Selector */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {cars.map(car => (
          <button
            key={car.id}
            onClick={() => setSelectedCarId(car.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedCarId === car.id ? 'var(--accent-gold)' : 'var(--bg-surface)',
              color: selectedCarId === car.id ? '#000' : 'white',
              border: selectedCarId === car.id ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {car.make} {car.model}
          </button>
        ))}
      </div>

      {/* Classic Monthly Calendar */}
      {selectedCarId && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={prevMonth} style={{ padding: '8px 16px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>&larr; Попередній</button>
            <h2 style={{ fontSize: '24px', color: 'white', margin: 0 }}>{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} style={{ padding: '8px 16px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Наступний &rarr;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
              <div key={d} style={{ textAlign: 'center', color: '#8a8a93', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', padding: '8px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Empty cells for start of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '100px', backgroundColor: 'transparent' }} />
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
                  style={{
                    minHeight: '100px',
                    backgroundColor: booking ? 'rgba(233,195,73,0.1)' : '#13131a',
                    border: booking ? '1px solid rgba(233,195,73,0.4)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ color: booking ? '#e9c349' : 'white', fontWeight: 'bold', fontSize: '16px' }}>{dayNum}</div>
                  
                  {booking && (
                    <div style={{ 
                      marginTop: '8px', 
                      backgroundColor: isStartDay ? 'var(--accent-gold)' : 'rgba(233,195,73,0.2)', 
                      color: isStartDay ? '#000' : '#e9c349',
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: '16px', 
            border: '1px solid var(--accent-gold)', minWidth: '400px', maxWidth: '600px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '24px' }}>Деталі Поїздки</h2>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              ID: {selectedBooking.id.substring(0,8)}... | Статус: {selectedBooking.status}
            </div>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ backgroundColor: '#13131a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 8px', color: '#8a8a93', fontSize: '12px', textTransform: 'uppercase' }}>Клієнт</p>
                <p style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>{selectedBooking.client.name}</p>
                <p style={{ margin: '4px 0 0', color: 'white' }}>{selectedBooking.client.phone}</p>
              </div>

              <div style={{ backgroundColor: '#13131a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 8px', color: '#8a8a93', fontSize: '12px', textTransform: 'uppercase' }}>Маршрут та Дати</p>
                <p style={{ margin: '0 0 8px', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{selectedBooking.routeFrom} &rarr; {selectedBooking.routeTo}</p>
                <p style={{ margin: 0, color: 'var(--accent-gold)' }}>
                  {new Date(selectedBooking.dateStart).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} 
                  &nbsp;&mdash;&nbsp; 
                  {new Date(selectedBooking.dateEnd).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#13131a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ margin: '0 0 8px', color: '#8a8a93', fontSize: '12px', textTransform: 'uppercase' }}>Призначений Водій</p>
                  <p style={{ margin: 0, color: selectedBooking.driver ? 'white' : '#ef4444', fontWeight: 'bold' }}>
                    {selectedBooking.driver ? selectedBooking.driver.user.name : 'Не призначено'}
                  </p>
                </div>
                
                <div style={{ backgroundColor: '#13131a', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ margin: '0 0 8px', color: '#8a8a93', fontSize: '12px', textTransform: 'uppercase' }}>Фінанси</p>
                  <p style={{ margin: '0 0 4px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Сума клієнта:</span> <strong>€{selectedBooking.price}</strong>
                  </p>
                  {selectedBooking.netProfit !== undefined && selectedBooking.netProfit !== null && (
                    <p style={{ margin: 0, color: '#4ade80', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Чиста маржа:</span> <strong>€{selectedBooking.netProfit}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedBooking(null)} 
              style={{ width: '100%', marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Закрити
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
