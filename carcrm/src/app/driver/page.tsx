import { PrismaClient } from '@prisma/client';
import { Calendar, User, CheckCircle } from 'lucide-react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DriverDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'DRIVER') {
    return (
      <div className="admin-page-container">
        <h1>У вас немає доступу до цієї сторінки. Тільки для водіїв.</h1>
      </div>
    );
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id as string },
    include: { user: true }
  });

  if (!driver || !driver.active) {
    return (
      <div className="admin-page-container">
        <h1>Ваш профіль водія неактивний або не знайдений. Зверніться до адміністратора.</h1>
      </div>
    );
  }

  // Fetch upcoming bookings for this driver
  const upcomingBookings = await prisma.booking.findMany({
    where: { 
      driverId: driver.id,
      dateStart: { gte: new Date() },
      status: 'CONFIRMED'
    },
    include: { car: true, client: true },
    orderBy: { dateStart: 'asc' }
  });

  // Fetch completed bookings for this driver
  const completedBookings = await prisma.booking.findMany({
    where: {
      driverId: driver.id,
      status: 'COMPLETED'
    },
    include: { car: true, client: true },
    orderBy: { dateStart: 'desc' }
  });

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Вітаємо, {driver.user.name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ваші найближчі рейси та завдання.</p>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--accent-gold)" /> 
          Майбутні рейси ({upcomingBookings.length})
        </h2>
        
        {upcomingBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>У вас поки немає призначених рейсів.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(233,195,73,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '4px' }}>
                      {booking.dateStart.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 'bold' }}>
                      {booking.routeFrom} ➔ {booking.routeTo}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '24px', color: '#e4e2e3', fontSize: '14px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Клієнт:</span>
                        <strong>{booking.client.name}</strong><br/>
                        <a href={`tel:${booking.client.phone}`} style={{ color: 'var(--accent-gold)' }}>{booking.client.phone}</a>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Деталі:</span>
                        Пасажирів: {booking.passengers}<br/>
                        Авто: {booking.car.make} {booking.car.model}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(233, 195, 73, 0.2)',
                      color: '#e9c349'
                    }}>
                      ПРИЗНАЧЕНО
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="var(--accent-gold)" /> 
          Завершені рейси ({completedBookings.length})
        </h2>
        {completedBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Історія рейсів порожня.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {completedBookings.map(booking => (
              <div key={booking.id} className="glass-panel" style={{ padding: '16px 24px', borderRadius: '12px', opacity: 0.7 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{booking.routeFrom} ➔ {booking.routeTo}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{booking.dateStart.toLocaleDateString('uk-UA')}</div>
                    </div>
                    <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '14px' }}>ЗАВЕРШЕНО</div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
