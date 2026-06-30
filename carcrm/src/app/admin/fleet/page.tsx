'use client';

import { useEffect, useState } from 'react';

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  baseRate: number;
  fuelConsumption: number;
  status: string;
  images: string[];
  videos: string[];
};

export default function AdminFleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    capacity: 4, baseRate: 0, fuelConsumption: 0
  });
  const [uploading, setUploading] = useState(false);

  const fetchCars = () => {
    setLoading(true);
    fetch('/api/cars')
      .then(res => res.json())
      .then(data => { setCars(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCars(); }, []);

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
        setFormData({ make: '', model: '', year: new Date().getFullYear(), capacity: 4, baseRate: 0, fuelConsumption: 0 });
        fetchCars();
      }
    } catch (err) { console.error(err); }
  };

  const handleMediaUpload = async (carId: string, file: File, mediaType: 'image' | 'video') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'fleet');

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        const res = await fetch(`/api/cars/${carId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadData.url, mediaType })
        });
        if (res.ok) fetchCars();
      }
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleMediaDelete = async (carId: string, url: string, mediaType: 'image' | 'video') => {
    try {
      const res = await fetch(`/api/cars/${carId}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mediaType })
      });
      if (res.ok) fetchCars();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це авто?')) return;
    try {
      const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
      if (res.ok) fetchCars();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Автопарк</h1>
        <button 
          onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
          style={{ padding: '12px 24px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px' }}
        >
          + Додати авто
        </button>
      </div>

      <div style={{ marginTop: '32px', display: 'grid', gap: '24px' }}>
        {loading ? <p>Завантаження...</p> : cars.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Немає автомобілів в базі</p> : (
          cars.map(car => (
            <div key={car.id} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Car Header */}
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>{car.make} {car.model}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                    {car.year} • {car.capacity} місць • €{car.baseRate}/км • {car.fuelConsumption} л/100км
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    backgroundColor: car.status === 'AVAILABLE' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.1)',
                    color: car.status === 'AVAILABLE' ? '#4ade80' : 'white',
                    borderRadius: '6px', fontSize: '12px', fontWeight: 'bold'
                  }}>{car.status === 'AVAILABLE' ? 'ДОСТУПНИЙ' : car.status}</span>
                  <button onClick={() => handleDelete(car.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>Видалити</button>
                </div>
              </div>

              {/* Media Gallery */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Фото та Відео</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ padding: '8px 16px', backgroundColor: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {uploading ? '⏳ Завантаження...' : '📷 Додати фото'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                        onChange={e => { if (e.target.files?.[0]) handleMediaUpload(car.id, e.target.files[0], 'image'); }} />
                    </label>
                    <label style={{ padding: '8px 16px', backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {uploading ? '⏳ Завантаження...' : '🎬 Додати відео'}
                      <input type="file" accept="video/*" style={{ display: 'none' }} disabled={uploading}
                        onChange={e => { if (e.target.files?.[0]) handleMediaUpload(car.id, e.target.files[0], 'video'); }} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {car.images.map((img, i) => (
                    <div key={`img-${i}`} style={{ width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-color)' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => handleMediaDelete(car.id, img, 'image')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '14px' }}>✕</button>
                    </div>
                  ))}
                  {car.videos.map((vid, i) => (
                    <div key={`vid-${i}`} style={{ width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #60a5fa' }}>
                      <video src={vid} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'white', fontSize: '24px' }}>▶</div>
                      <button onClick={() => handleMediaDelete(car.id, vid, 'video')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '14px' }}>✕</button>
                    </div>
                  ))}
                  {car.images.length === 0 && car.videos.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>Немає медіа файлів. Натисніть &quot;Додати фото&quot; або &quot;Додати відео&quot;.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Car Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', width: '480px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent-gold)' }}>Нове авто</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Марка</label>
                <input required value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Модель</label>
                <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Рік</label>
                <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Місць</label>
                <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Базова ставка (€/км)</label>
                <input type="number" step="0.01" required value={formData.baseRate} onChange={e => setFormData({...formData, baseRate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Витрата (л/100км)</label>
                <input type="number" step="0.1" required value={formData.fuelConsumption} onChange={e => setFormData({...formData, fuelConsumption: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>Створити</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', borderRadius: '8px' }}>Скасувати</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
