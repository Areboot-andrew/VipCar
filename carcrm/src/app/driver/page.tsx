import { PrismaClient } from '@prisma/client';
import { Calendar } from 'lucide-react';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DriverDashboard() {
  // In a real scenario, this driverId would come from session/auth cookie.
  // We'll fetch the first active driver for demonstration purposes.
  const driver = await prisma.driver.findFirst({
    where: { active: true },
    include: { user: true }
  });

  if (!driver) {
    return (
      <div className="admin-page-container">
        <h1>Немає активних водіїв у системі.</h1>
      </div>
    );
  }

  // Fetch upcoming bookings for this driver
  const upcomingBookings = await prisma.booking.findMany({
    where: { 
      driverId: driver.id,
      dateStart: { gte: new Date() }
    },
    include: { car: true, client: true },
    orderBy: { dateStart: 'asc' }
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
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>У вас поки немає призначених рейсів.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {booking.dateStart.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                    {booking.routeFrom} ➔ {booking.routeTo}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Авто: {booking.car.make} {booking.car.model} | Клієнт: {booking.client.name} ({booking.client.phone})
                  </div>
                </div>
                <div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    backgroundColor: booking.status === 'CONFIRMED' ? 'rgba(233, 195, 73, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: booking.status === 'CONFIRMED' ? '#e9c349' : '#fff'
                  }}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
