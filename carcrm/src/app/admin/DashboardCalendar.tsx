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
};

export default function DashboardCalendar({ cars, bookings }: { cars: Car[], bookings: Booking[] }) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const handleCellClick = (carId: string, day: Date) => {
    // Check if there is a booking on this day
    const booking = getBookingForDay(carId, day);
    if (booking) {
      setSelectedBooking(booking);
    } else {
      // In the future, this will open a "New Booking" modal
      alert(`Створити нову бронь для авто ID: ${carId} на ${day.toLocaleDateString('uk-UA')}?`);
    }
  };

  const getBookingForDay = (carId: string, day: Date) => {
    return bookings.find(b => {
      const bStart = new Date(b.dateStart);
      const bEnd = new Date(b.dateEnd);
      bStart.setHours(0,0,0,0);
      bEnd.setHours(23,59,59,999);
      return b.carId === carId && day >= bStart && day <= bEnd;
    });
  };

  return (
    <>
      <div className="calendar-grid-90">
        <div className="calendar-legend">
          <div className="legend-item"><span className="legend-color available"></span> Вільне авто</div>
          <div className="legend-item"><span className="legend-color booked"></span> Заброньовано</div>
          <div className="legend-item"><span className="legend-color maintenance"></span> ТО</div>
        </div>

        <div className="calendar-scroll-container">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="sticky-col">Автомобіль</th>
                {days.map((day, i) => (
                  <th key={i} className="calendar-day-header">
                    <div className="day-name">{day.toLocaleDateString('uk-UA', { weekday: 'short' })}</div>
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-month">{day.toLocaleDateString('uk-UA', { month: 'short' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td className="sticky-col car-info">
                    <strong>{car.make} {car.model}</strong>
                  </td>
                  {days.map((day, i) => {
                    const booking = getBookingForDay(car.id, day);
                    const isStartDay = booking && new Date(booking.dateStart).getDate() === day.getDate();
                    
                    return (
                      <td 
                        key={i} 
                        className={`calendar-cell ${booking ? 'booked' : 'available'}`}
                        onClick={() => handleCellClick(car.id, day)}
                        style={{ cursor: 'pointer' }}
                      >
                        {booking && isStartDay && (
                          <div className="booking-chip" title={`${booking.routeFrom} - ${booking.routeTo}`}>
                            {booking.routeFrom.substring(0,3)}. - {booking.routeTo.substring(0,3)}.
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-surface)', padding: '24px', border: '1px solid var(--accent-gold)',
          zIndex: 1000, minWidth: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          <h2 style={{ color: 'var(--accent-gold)', marginBottom: '16px' }}>Деталі рейсу</h2>
          <p><strong>Маршрут:</strong> {selectedBooking.routeFrom} ➔ {selectedBooking.routeTo}</p>
          <p><strong>Клієнт:</strong> {selectedBooking.client.name} ({selectedBooking.client.phone})</p>
          <p><strong>Водій:</strong> {selectedBooking.driver?.user.name || 'Не призначено'}</p>
          <p><strong>Дати:</strong> {new Date(selectedBooking.dateStart).toLocaleDateString()} - {new Date(selectedBooking.dateEnd).toLocaleDateString()}</p>
          <p><strong>Статус:</strong> {selectedBooking.status}</p>
          <button onClick={() => setSelectedBooking(null)} style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            Закрити
          </button>
        </div>
      )}
    </>
  );
}
