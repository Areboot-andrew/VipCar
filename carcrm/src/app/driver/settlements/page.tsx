import { PrismaClient } from '@prisma/client';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DriverSettlementsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'DRIVER') {
    return <div className="admin-page-container"><h1>Немає доступу. Тільки для водіїв.</h1></div>;
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id as string },
    include: { user: true }
  });

  if (!driver || !driver.active) return <div className="admin-page-container"><h1>Профіль водія неактивний</h1></div>;

  const settlements = await prisma.settlement.findMany({
    where: { driverId: driver.id },
    orderBy: { date: 'desc' }
  });

  const totalPaid = settlements.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = settlements.filter(s => s.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Взаєморозрахунки</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ваші виплати та баланс.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderLeft: '4px solid #4ade80' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Виплачено</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>€{totalPaid}</div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderLeft: '4px solid var(--accent-gold)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Очікується</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '8px' }}>€{totalPending}</div>
        </div>
      </div>

      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={20} color="var(--accent-gold)" /> 
          Історія транзакцій
        </h2>

        {settlements.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)' }}>У вас поки немає історії виплат.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {settlements.map(settlement => (
              <div key={settlement.id} className="glass-panel" style={{ padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {new Date(settlement.date).toLocaleDateString('uk-UA')}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
                    Виплата за рейс
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: settlement.status === 'PAID' ? '#4ade80' : 'var(--accent-gold)' }}>
                    +€{settlement.amount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    {settlement.status === 'PAID' ? <CheckCircle size={12} color="#4ade80" /> : <Clock size={12} color="var(--accent-gold)" />}
                    {settlement.status === 'PAID' ? 'Зараховано' : 'В обробці'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
