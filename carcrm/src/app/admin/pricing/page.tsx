'use client';

import { useEffect, useState } from 'react';

type Car = {
  id: string;
  make: string;
  model: string;
  fuelConsumptionCity: number;
  fuelConsumptionHighway: number;
};

export default function AdminPricingPage() {
  const [settings, setSettings] = useState({
    fuel_price: '60',
    driver_salary_rate: '0.1',
    amortization_rate: '0.05',
    margin_rate: '0.2',
    delivery_rate: '15',
    base_location_lat: '49.8397',
    base_location_lng: '24.0297'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  
  // Sandbox State
  const [calcCarId, setCalcCarId] = useState('');
  const [calcDistCity, setCalcDistCity] = useState(20);
  const [calcDistHighway, setCalcDistHighway] = useState(80);
  const [calcDeliveryDist, setCalcDeliveryDist] = useState(0);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      });
      
    fetch('/api/cars')
      .then(res => res.json())
      .then(data => {
        setCars(data);
        if (data.length > 0) setCalcCarId(data[0].id);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    alert('Налаштування збережено!');
  };

  const currentCar = cars.find(c => c.id === calcCarId);
  const fuelCity = currentCar ? (calcDistCity / 100) * currentCar.fuelConsumptionCity : 0;
  const fuelHighway = currentCar ? (calcDistHighway / 100) * currentCar.fuelConsumptionHighway : 0;
  const totalDist = calcDistCity + calcDistHighway;
  
  const costFuel = (fuelCity + fuelHighway) * parseFloat(settings.fuel_price || '0');
  const costDriver = totalDist * parseFloat(settings.driver_salary_rate || '0');
  const costAmortization = totalDist * parseFloat(settings.amortization_rate || '0');
  const costDelivery = calcDeliveryDist * parseFloat(settings.delivery_rate || '0');
  const netProfit = totalDist * parseFloat(settings.margin_rate || '0');
  
  const totalCost = costFuel + costDriver + costAmortization + costDelivery;
  const finalPrice = totalCost + netProfit;

  if (loading) return <div className="admin-page-container">Завантаження...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Смарт-Прайсинг</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Керування фінансовою моделлю бізнесу та симулятор прибутковості.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* SETTINGS FORM */}
        <form onSubmit={handleSave} style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ color: 'var(--accent-gold)', marginBottom: '24px', fontSize: '20px' }}>Глобальні Коефіцієнти</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ціна Пального (грн/л)</label>
              <input value={settings.fuel_price} onChange={e => setSettings({...settings, fuel_price: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Зарплата Водія (євро/км)</label>
              <input type="number" step="0.01" value={settings.driver_salary_rate} onChange={e => setSettings({...settings, driver_salary_rate: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Амортизація авто (євро/км)</label>
              <input type="number" step="0.01" value={settings.amortization_rate} onChange={e => setSettings({...settings, amortization_rate: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Чиста Маржа (євро/км)</label>
              <input type="number" step="0.01" value={settings.margin_rate} onChange={e => setSettings({...settings, margin_rate: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Вартість Подачі Авто (євро/км)</label>
              <input type="number" step="0.01" value={settings.delivery_rate} onChange={e => setSettings({...settings, delivery_rate: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>База LAT (Львів)</label>
                <input value={settings.base_location_lat} onChange={e => setSettings({...settings, base_location_lat: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>База LNG (Львів)</label>
                <input value={settings.base_location_lng} onChange={e => setSettings({...settings, base_location_lng: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Telegram Bot Token (Для чату)</label>
              <input value={settings.telegram_bot_token || ''} onChange={e => setSettings({...settings, telegram_bot_token: e.target.value})} placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', marginTop: '32px', padding: '16px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px', fontSize: '16px' }}>
            {saving ? 'Збереження...' : 'Зберегти Налаштування'}
          </button>
        </form>

        {/* SANDBOX CALCULATOR */}
        <div style={{ backgroundColor: '#080818', padding: '32px', borderRadius: '16px', border: '1px solid rgba(233, 195, 73, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '24px' }}>Симулятор рентабельності</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Введіть дані тестового рейсу, щоб побачити фінансову розбивку.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#e9c349', marginBottom: '8px' }}>Оберіть авто</label>
              <select value={calcCarId} onChange={e => setCalcCarId(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}>
                {cars.map(c => <option key={c.id} value={c.id}>{c.make} {c.model} (М: {c.fuelConsumptionCity}л, Т: {c.fuelConsumptionHighway}л)</option>)}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#e9c349', marginBottom: '8px' }}>Місто (км)</label>
                <input type="number" value={calcDistCity} onChange={e => setCalcDistCity(Number(e.target.value))} style={{ width: '100%', padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#e9c349', marginBottom: '8px' }}>Траса (км)</label>
                <input type="number" value={calcDistHighway} onChange={e => setCalcDistHighway(Number(e.target.value))} style={{ width: '100%', padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#e9c349', marginBottom: '8px' }}>Подача (км)</label>
                <input type="number" value={calcDeliveryDist} onChange={e => setCalcDeliveryDist(Number(e.target.value))} style={{ width: '100%', padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#13131a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '16px' }}>Структура Витрат</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
              <span style={{ color: '#c7c6ca' }}>Пальне ({(fuelCity + fuelHighway).toFixed(1)} л)</span>
              <span style={{ color: '#ef4444' }}>- {costFuel.toFixed(2)} грн</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
              <span style={{ color: '#c7c6ca' }}>Зарплата Водія ({totalDist} км)</span>
              <span style={{ color: '#ef4444' }}>- €{costDriver.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
              <span style={{ color: '#c7c6ca' }}>Амортизація Авто</span>
              <span style={{ color: '#ef4444' }}>- €{costAmortization.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '15px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: '#c7c6ca' }}>Подача до клієнта ({calcDeliveryDist} км)</span>
              <span style={{ color: '#ef4444' }}>- €{costDelivery.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              <span style={{ color: '#4ade80' }}>Чиста Маржа (Прибуток)</span>
              <span style={{ color: '#4ade80' }}>+ €{netProfit.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(233,195,73,0.3)' }}>
              <span style={{ color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px', fontWeight: 'bold' }}>Ціна Клієнта</span>
              <span style={{ color: 'white', fontSize: '32px', fontWeight: '900' }}>€{finalPrice.toFixed(2)}</span>
            </div>
            <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              *Без врахування дод. послуг (крісла, тварини)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
