'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, UserPlus, Car } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings').then(res => res.json()),
      fetch('/api/drivers').then(res => res.json())
    ]).then(([bookingsData, driversData]) => {
      setBookings(bookingsData);
      setDrivers(driversData);
      setLoading(false);
    });
  }, []);

  const updateBooking = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedBooking = await res.json();
        setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
      } else {
        alert('Помилка оновлення');
      }
    } catch (e) {
      console.error(e);
      alert('Помилка оновлення');
    }
  };

  if (loading) return <div className="admin-page-container"><p>Завантаження заявок...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Управління Заявками</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Переглядайте та обробляйте нові бронювання, призначайте водіїв.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {bookings.map(booking => (
          <div key={booking.id} className="glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>
                  {booking.routeFrom} ➔ {booking.routeTo}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  {new Date(booking.dateStart).toLocaleString('uk-UA')}
                </p>
              </div>
              <div style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                backgroundColor: booking.status === 'PENDING' ? 'rgba(255,255,255,0.1)' : 
                                 booking.status === 'CONFIRMED' ? 'rgba(233, 195, 73, 0.2)' : 'rgba(255,0,0,0.1)',
                color: booking.status === 'PENDING' ? '#fff' : 
                       booking.status === 'CONFIRMED' ? '#e9c349' : '#ff4444'
              }}>
                {booking.status}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <p style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 'bold' }}>Клієнт</p>
                <p>{booking.client.name}</p>
                <p>{booking.client.phone}</p>
                <p>{booking.client.email}</p>
              </div>
              <div>
                <p style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 'bold' }}>Рейс</p>
                <p>Авто: {booking.car.make} {booking.car.model}</p>
                <p>Відстань: {booking.distance} км</p>
                <p>Вартість: €{booking.price}</p>
              </div>
              <div>
                <p style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 'bold' }}>Деталі поїздки</p>
                <p>Пасажири: {booking.passengers} (Діти: {booking.children})</p>
                <p>Багаж: {booking.luggage}</p>
                <p>Тварини: {booking.animals ? 'Так' : 'Ні'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 'bold' }}>Призначення</p>
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#131314', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                  value={booking.driverId || ''}
                  onChange={(e) => updateBooking(booking.id, { driverId: e.target.value })}
                >
                  <option value="">-- Не призначено --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {booking.status === 'PENDING' && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => updateBooking(booking.id, { status: 'CONFIRMED' })}
                  style={{ padding: '10px 24px', backgroundColor: 'var(--accent-gold)', color: '#000', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                >
                  <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Підтвердити
                </button>
                <button 
                  onClick={() => updateBooking(booking.id, { status: 'CANCELLED' })}
                  style={{ padding: '10px 24px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '6px', cursor: 'pointer', border: 'none' }}
                >
                  <XCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Відхилити
                </button>
              </div>
            )}
          </div>
        ))}
        {bookings.length === 0 && <p>Немає жодної заявки.</p>}
      </div>
    </div>
  );
}
