'use client';

import { useEffect, useState } from 'react';

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  status: string;
  baseRate: number;
};

export default function AdminFleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    capacity: 4, baseRate: 0, fuelConsumption: 0
  });

  const fetchCars = () => {
    setLoading(true);
    fetch('/api/cars')
      .then(res => res.json())
      .then(data => {
        setCars(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCars(); // Refresh list
      } else {
        alert("Помилка створення авто");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Автопарк</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '12px 24px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Додати авто
        </button>
      </div>

      <div className="admin-table-container" style={{ marginTop: '32px' }}>
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '12px' }}>Марка/Модель</th>
                <th style={{ padding: '12px' }}>Рік</th>
                <th style={{ padding: '12px' }}>Базова ставка</th>
                <th style={{ padding: '12px' }}>Статус</th>
                <th style={{ padding: '12px' }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {cars.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Немає автомобілів в базі
                  </td>
                </tr>
              ) : (
                cars.map(car => (
                  <tr key={car.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{car.make} {car.model}</td>
                    <td style={{ padding: '12px' }}>{car.year}</td>
                    <td style={{ padding: '12px' }}>${car.baseRate}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: car.status === 'AVAILABLE' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: car.status === 'AVAILABLE' ? 'var(--accent-gold)' : 'white',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {car.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer' }}>Редагувати</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', width: '400px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent-gold)' }}>Нове авто</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Марка</label>
              <input required value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Модель</label>
              <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Рік випуску</label>
              <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Базова ставка ($)</label>
              <input type="number" required value={formData.baseRate} onChange={e => setFormData({...formData, baseRate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>Зберегти</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer' }}>Скасувати</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
