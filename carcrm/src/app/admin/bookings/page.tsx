'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="admin-page-container"><p>Завантаження заявок...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Управління Заявками</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Переглядайте та обробляйте нові бронювання.</p>
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
                backgroundColor: booking.status === 'PENDING' ? 'rgba(255,255,255,0.1)' : 'rgba(233, 195, 73, 0.2)',
                color: booking.status === 'PENDING' ? '#fff' : '#e9c349'
              }}>
                {booking.status}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Клієнт:</strong> {booking.client.name}</p>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Телефон:</strong> {booking.client.phone}</p>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Email:</strong> {booking.client.email}</p>
              </div>
              <div>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Автомобіль:</strong> {booking.car.make} {booking.car.model}</p>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Відстань:</strong> {booking.distance} км</p>
                <p><strong style={{ color: 'var(--text-secondary)' }}>Вартість:</strong> €{booking.price}</p>
              </div>
            </div>

            {booking.status === 'PENDING' && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button style={{ padding: '10px 24px', backgroundColor: 'var(--accent-gold)', color: '#000', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                  <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Підтвердити
                </button>
                <button style={{ padding: '10px 24px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '6px', cursor: 'pointer', border: 'none' }}>
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
