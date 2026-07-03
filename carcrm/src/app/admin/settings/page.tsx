'use client';
import { useState, useEffect } from 'react';
import { Settings, Globe, Fuel, Plus, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newCurrency, setNewCurrency] = useState({ currency: 'UAH', rateToEur: 42.5 });
  const [newFuel, setNewFuel] = useState({ country: 'Україна', fuelType: 'Дизель', priceEur: 1.10 });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setCurrencies(data.currencies || []);
      setFuelPrices(data.fuelPrices || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'currency', ...newCurrency })
      });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Видалити курс?')) return;
    try {
      await fetch(`/api/settings?type=currency&id=${id}`, { method: 'DELETE' });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fuel', ...newFuel })
      });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const handleDeleteFuel = async (id: string) => {
    if (!confirm('Видалити ціну на пальне?')) return;
    try {
      await fetch(`/api/settings?type=fuel&id=${id}`, { method: 'DELETE' });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-white p-8">Завантаження...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={32} className="text-[#e9c349]" />
        <h1 className="text-3xl font-bold text-white">Глобальні Налаштування</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Currencies */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-[#e9c349]" />
            <h2 className="text-xl font-bold text-white">Курси Валют (відносно 1 EUR)</h2>
          </div>

          <form onSubmit={handleAddCurrency} className="flex gap-4 mb-6">
            <input required placeholder="Валюта (напр. UAH)" value={newCurrency.currency} onChange={e => setNewCurrency({...newCurrency, currency: e.target.value.toUpperCase()})} className="bg-black/50 border border-white/20 rounded-lg p-2 text-white flex-1" />
            <input required type="number" step="0.0001" placeholder="Курс (напр. 42.50)" value={newCurrency.rateToEur} onChange={e => setNewCurrency({...newCurrency, rateToEur: parseFloat(e.target.value)})} className="bg-black/50 border border-white/20 rounded-lg p-2 text-white flex-1" />
            <button type="submit" className="bg-[#e9c349] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#ffe175]"><Plus size={18}/> Додати</button>
          </form>

          <div className="space-y-3">
            {currencies.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-[#e9c349] font-bold text-lg">{c.currency}</span>
                  <span className="text-gray-300">1 EUR = {c.rateToEur} {c.currency}</span>
                </div>
                <button onClick={() => handleDeleteCurrency(c.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18}/></button>
              </div>
            ))}
            {currencies.length === 0 && <p className="text-gray-500 italic">Немає доданих валют</p>}
          </div>
        </div>

        {/* Fuel Prices */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Fuel className="text-[#e9c349]" />
            <h2 className="text-xl font-bold text-white">Ціни на Пальне (EUR)</h2>
          </div>

          <form onSubmit={handleAddFuel} className="grid grid-cols-2 gap-4 mb-6">
            <input required placeholder="Країна (напр. Польща)" value={newFuel.country} onChange={e => setNewFuel({...newFuel, country: e.target.value})} className="bg-black/50 border border-white/20 rounded-lg p-2 text-white" />
            <select required value={newFuel.fuelType} onChange={e => setNewFuel({...newFuel, fuelType: e.target.value})} className="bg-black/50 border border-white/20 rounded-lg p-2 text-white">
              <option value="Бензин">Бензин</option>
              <option value="Дизель">Дизель</option>
              <option value="Газ">Газ</option>
              <option value="Електро">Електро</option>
            </select>
            <div className="col-span-2 flex gap-4">
              <input required type="number" step="0.01" placeholder="Ціна (EUR)" value={newFuel.priceEur} onChange={e => setNewFuel({...newFuel, priceEur: parseFloat(e.target.value)})} className="bg-black/50 border border-white/20 rounded-lg p-2 text-white flex-1" />
              <button type="submit" className="bg-[#e9c349] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#ffe175]"><Plus size={18}/> Додати</button>
            </div>
          </form>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {fuelPrices.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{f.country} <span className="text-gray-400 font-normal">({f.fuelType})</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#e9c349] font-bold text-lg">€{f.priceEur}</span>
                  <button onClick={() => handleDeleteFuel(f.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
            {fuelPrices.length === 0 && <p className="text-gray-500 italic">Немає цін на пальне</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
