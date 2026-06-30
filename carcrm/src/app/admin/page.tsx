import { PrismaClient } from '@prisma/client';
import DashboardCalendar from './DashboardCalendar';

const prisma = new PrismaClient();

// Disable caching so we always see fresh data
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Fetch real data from the database
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Fetch bookings for the next 90 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const ninetyDaysFromNow = new Date(today);
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const bookings = await prisma.booking.findMany({
    where: {
      dateStart: { lte: ninetyDaysFromNow },
      dateEnd: { gte: today },
    },
    include: {
      client: true,
      driver: { include: { user: true } },
    }
  });

  // Serialize dates to pass to client component safely
  const serializedBookings = bookings.map(b => ({
    ...b,
    dateStart: b.dateStart.toISOString(),
    dateEnd: b.dateEnd.toISOString(),
  }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Дашборд (90 Днів)</h1>
        <p>Календар зайнятості автопарку. Усі дані завантажені з бази.</p>
      </div>
      
      {cars.length === 0 ? (
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <p>Автопарк порожній. Будь ласка, додайте автомобілі в розділі "Автопарк", щоб вони з'явилися в календарі.</p>
        </div>
      ) : (
        <DashboardCalendar cars={cars} bookings={serializedBookings} />
      )}
    </div>
  );
}
