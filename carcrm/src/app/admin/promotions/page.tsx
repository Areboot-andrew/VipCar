'use client';

import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';

export default function PromotionsPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [discount, setDiscount] = useState('');

  const fetchPromos = () => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        setPromos(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, routeFrom, routeTo, discount })
    });
    setTitle(''); setRouteFrom(''); setRouteTo(''); setDiscount('');
    fetchPromos();
  };

  if (loading) return <div className="admin-page-container"><p>Завантаження...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Знижки (Empty Legs)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Керуйте знижками на конкретні маршрути (порожні рейси).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginTop: '24px' }}>
        {/* Form */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--accent-gold)', marginBottom: '16px' }}>Створити нову знижку</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Назва акції</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} placeholder="Знижка Варшава-Київ" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Звідки</label>
              <input value={routeFrom} onChange={e => setRouteFrom(e.target.value)} type="text" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} placeholder="Варшава" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Куди</label>
              <input value={routeTo} onChange={e => setRouteTo(e.target.value)} type="text" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} placeholder="Київ" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Знижка (%)</label>
              <input required value={discount} onChange={e => setDiscount(e.target.value)} type="number" min="1" max="100" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} placeholder="30" />
            </div>
            <button type="submit" style={{ padding: '12px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
              Додати знижку
            </button>
          </form>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {promos.map(promo => (
            <div key={promo.id} className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={18} color="var(--accent-gold)" />
                  {promo.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Маршрут: {promo.routeFrom || 'Будь-яке місто'} ➔ {promo.routeTo || 'Будь-яке місто'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>-{promo.discount}%</div>
                <div style={{ fontSize: '12px', color: promo.active ? '#4ade80' : '#f87171' }}>
                  {promo.active ? 'Активна' : 'Неактивна'}
                </div>
              </div>
            </div>
          ))}
          {promos.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Немає активних акцій.</p>}
        </div>
      </div>
    </div>
  );
}
