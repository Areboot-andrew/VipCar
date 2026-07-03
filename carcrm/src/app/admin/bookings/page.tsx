'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ChatWidget from '@/components/ChatWidget';
import DashboardCalendar from '../DashboardCalendar';

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings').then((res) => res.json()),
      fetch('/api/drivers').then((res) => res.json()),
      fetch('/api/cars').then((res) => res.json()),
    ])
      .then(([bookingsData, driversData, carsData]) => {
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setDrivers(Array.isArray(driversData) ? driversData : []);
        setCars(Array.isArray(carsData) ? carsData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page-container"><p>Завантаження заявок...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-[#e9c349]" size={30} />
          <div>
            <h1>Заявки і календар</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Рейси, статуси, водії, час подачі, нотатки і чат з клієнтом.</p>
          </div>
        </div>
      </div>

      <DashboardCalendar cars={cars} bookings={bookings} drivers={drivers} onOpenChat={setActiveChatBookingId} />

      {activeChatBookingId && session?.user && (
        <ChatWidget
          bookingId={activeChatBookingId}
          currentUserId={(session.user as any).id || ''}
          onClose={() => setActiveChatBookingId(null)}
        />
      )}
    </div>
  );
}
