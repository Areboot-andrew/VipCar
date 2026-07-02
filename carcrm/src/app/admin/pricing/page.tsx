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

            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '16px' }}>Facebook Messenger (Бізнес-сторінка)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Щоб підключити Facebook, створіть додаток у <strong>Meta for Developers</strong> (developers.facebook.com). 
                У налаштуваннях Messenger згенеруйте <em>Page Access Token</em> для вашої сторінки. <br/>
                Потім у розділі Webhooks вкажіть URL <code>https://ваш-домен/api/webhooks/messenger</code> і впишіть придуманий вами <em>Verify Token</em>.
              </p>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Page Access Token (З кабінету Meta)</label>
                  <input value={settings.facebook_page_token || ''} onChange={e => setSettings({...settings, facebook_page_token: e.target.value})} placeholder="EAAB..." style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Webhook Verify Token (Придумайте кодове слово)</label>
                  <input value={settings.facebook_verify_token || ''} onChange={e => setSettings({...settings, facebook_verify_token: e.target.value})} placeholder="наприклад: vipcar_secret_2026" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', marginTop: '32px', padding: '16px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px', fontSize: '16px' }}>
            {saving ? 'Збереження...' : 'Зберегти Налаштування'}
          </button>
        </form>

        {/* TELEGRAM MTPROTO LOGIN */}
        <div style={{ backgroundColor: '#080818', padding: '32px', borderRadius: '16px', border: '1px solid rgba(233, 195, 73, 0.3)', marginTop: '24px' }}>
          <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '20px' }}>Особистий Telegram (MTProto)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px', lineHeight: '1.5' }}>
            Підключіть свій особистий акаунт Telegram, щоб відповідати клієнтам прямо з CRM. <br/>
            <strong>Інструкція:</strong> Введіть свій номер телефону (з кодом +380) і натисніть "Отримати код". 
            Вам в офіційний додаток Telegram прийде сервісне повідомлення з кодом. 
            Впишіть цей код у відповідне поле нижче. Якщо у вас увімкнена двофакторна автентифікація (2FA), також введіть свій хмарний пароль.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input id="tg-phone" placeholder="Номер телефону (+380...)" style={{ flex: 1, padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
            <button onClick={async () => {
              const phone = (document.getElementById('tg-phone') as HTMLInputElement).value;
              const res = await fetch('/api/telegram/auth/sendCode', { method: 'POST', body: JSON.stringify({ phoneNumber: phone }) });
              const data = await res.json();
              if (data.phoneCodeHash) {
                (window as any).tgHash = data.phoneCodeHash;
                alert('Код надіслано в Telegram!');
              } else alert(data.error);
            }} style={{ padding: '12px 24px', backgroundColor: '#13131a', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>Отримати Код</button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <input id="tg-code" placeholder="Код підтвердження" style={{ flex: 1, padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
            <input id="tg-pwd" type="password" placeholder="2FA Пароль (якщо є)" style={{ flex: 1, padding: '12px', backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
          </div>

          <button onClick={async () => {
              const phone = (document.getElementById('tg-phone') as HTMLInputElement).value;
              const code = (document.getElementById('tg-code') as HTMLInputElement).value;
              const pwd = (document.getElementById('tg-pwd') as HTMLInputElement).value;
              const hash = (window as any).tgHash;
              const res = await fetch('/api/telegram/auth/verifyCode', { method: 'POST', body: JSON.stringify({ phoneNumber: phone, phoneCodeHash: hash, code, password: pwd }) });
              const data = await res.json();
              if (data.success) alert('Особистий Telegram успішно підключено!');
              else alert(data.error);
          }} style={{ width: '100%', marginTop: '16px', padding: '16px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>
            Підключити Telegram
          </button>
        </div>

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
