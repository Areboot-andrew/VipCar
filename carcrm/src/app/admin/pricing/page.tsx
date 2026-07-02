'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Euro, Fuel, Users, Briefcase, Dog, Baby } from 'lucide-react';

export default function PricingSettingsPage() {
  const [settings, setSettings] = useState({
    eur_to_uah_rate: "42.50",
    fuel_price: "1.65",
    driver_salary_rate: "15",
    price_per_person: "10",
    child_seat_fee: "15",
    animal_fee: "20",
    meet_and_greet_fee: "10",
    cross_border_fee: "50",
    weekend_coefficient: "1.2",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Налаштування успішно збережено!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Помилка збереження.');
      }
    } catch (err) {
      setMessage('Помилка сервера.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-[#e9c349]">Завантаження налаштувань...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="bg-[#13131a] p-6 rounded-2xl border border-white/10 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">Глобальні Коефіцієнти та Ціноутворення</h1>
        <p className="text-[#8a8a93] m-0">
          Ці значення використовуються калькулятором на головній сторінці для автоматичного розрахунку вартості поїздки.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Basic Rates */}
        <div className="bg-[#13131a] p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg space-y-6">
          <h2 className="text-[#e9c349] font-bold text-lg mb-4 border-b border-white/10 pb-4 flex items-center gap-2">
            <Euro size={20} /> Базові тарифи та витрати
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2">Курс Валют (1 EUR = UAH)</label>
              <input type="number" step="0.01" name="eur_to_uah_rate" value={settings.eur_to_uah_rate} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2 flex items-center gap-2"><Fuel size={16}/> Ціна Пального (за літр в EUR)</label>
              <input type="number" step="0.01" name="fuel_price" value={settings.fuel_price} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2">Стандартна ЗП водія (% від маржі)</label>
              <input type="number" step="1" name="driver_salary_rate" value={settings.driver_salary_rate} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
              <p className="text-xs text-[#8a8a93] mt-1">Використовується, якщо водій не має фіксованої ставки.</p>
            </div>
          </div>
        </div>

        {/* Extras & Coefficients */}
        <div className="bg-[#13131a] p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg space-y-6">
          <h2 className="text-[#e9c349] font-bold text-lg mb-4 border-b border-white/10 pb-4 flex items-center gap-2">
            <Briefcase size={20} /> Додаткові послуги та Коефіцієнти (в EUR)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2 flex items-center gap-2"><Users size={16}/> Ціна за особу (багаж)</label>
              <input type="number" step="1" name="price_per_person" value={settings.price_per_person} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2 flex items-center gap-2"><Baby size={16}/> Дитяче крісло</label>
              <input type="number" step="1" name="child_seat_fee" value={settings.child_seat_fee} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2 flex items-center gap-2"><Dog size={16}/> Тварини</label>
              <input type="number" step="1" name="animal_fee" value={settings.animal_fee} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2">Зустріч з табличкою</label>
              <input type="number" step="1" name="meet_and_greet_fee" value={settings.meet_and_greet_fee} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2">Виїзд за кордон (Міжнар. збір)</label>
              <input type="number" step="1" name="cross_border_fee" value={settings.cross_border_fee} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-2">Коефіцієнт вихідного дня (напр. 1.2)</label>
              <input type="number" step="0.1" name="weekend_coefficient" value={settings.weekend_coefficient} onChange={handleChange}
                className="w-full bg-[#1b1b1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e9c349] outline-none" required />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#e9c349] text-black font-bold py-3 px-8 rounded-xl transition-all shadow-[0_4px_15px_rgba(233,195,73,0.3)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Зберегти Налаштування
          </button>
          
          {message && (
            <span className={`font-semibold ${message.includes('Помилка') ? 'text-red-500' : 'text-green-500'} animate-fade-in`}>
              {message}
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
