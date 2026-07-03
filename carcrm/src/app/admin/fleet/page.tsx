'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, X, Image as ImageIcon, Video, Star, Trash2 } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

type CarReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  baseRate: number;
  fuelType: string;
  fuelConsumptionCity: number;
  fuelConsumptionHighway: number;
  status: string;
  images: string[];
  videos: string[];
  description?: string | null;
  features?: string | null;
  reviews?: CarReview[];
  
  pricePerPerson?: number;
  crossBorderFee?: number;
  meetAndGreetFee?: number;
  animalFee?: number;
  childSeatFee?: number;
  baseCity?: string | null;
};

export default function AdminFleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear().toString(),
    capacity: '4', baseRate: '0', fuelType: 'Бензин', fuelConsumptionCity: '0', fuelConsumptionHighway: '0',
    description: '', features: '[]', baseCity: 'Львів',
    pricePerPerson: '10', crossBorderFee: '150', meetAndGreetFee: '20', animalFee: '30', childSeatFee: '15'
  });
  const [featuresList, setFeaturesList] = useState<{icon: string, text: string}[]>([]);
  const [uploading, setUploading] = useState(false);

  // Edit State (for description and features of existing cars)
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Car>>({});
  const [editFeaturesList, setEditFeaturesList] = useState<{icon: string, text: string}[]>([]);

  // Reviews Modal State
  const [reviewsModalOpen, setReviewsModalOpen] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ author: '', rating: '5', text: '' });

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
      const payload = {
        ...formData,
        features: JSON.stringify(featuresList)
      };
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ make: '', model: '', year: new Date().getFullYear().toString(), capacity: '4', baseRate: '0', fuelType: 'Бензин', fuelConsumptionCity: '0', fuelConsumptionHighway: '0', description: '', features: '[]', baseCity: 'Львів', pricePerPerson: '10', crossBorderFee: '150', meetAndGreetFee: '20', animalFee: '30', childSeatFee: '15' });
        setFeaturesList([]);
        fetchCars();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateCar = async (carId: string) => {
    try {
      const payload = {
        ...editFormData,
        features: JSON.stringify(editFeaturesList)
      };
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingCarId(null);
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
    if (!confirm('Видалити медіа?')) return;
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

  const handleAddReview = async (e: React.FormEvent, carId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/cars/${carId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        setNewReview({ author: '', rating: '5', text: '' });
        fetchCars(); 
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteReview = async (carId: string, reviewId: string) => {
    if (!confirm('Видалити відгук?')) return;
    try {
      const res = await fetch(`/api/cars/${carId}/reviews`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      });
      if (res.ok) fetchCars();
    } catch (err) { console.error(err); }
  };

  const openEditMode = (car: Car) => {
    setEditingCarId(car.id);
    setEditFormData({
      description: car.description || '',
      pricePerPerson: car.pricePerPerson || 10,
      crossBorderFee: car.crossBorderFee || 150,
      meetAndGreetFee: car.meetAndGreetFee || 20,
      animalFee: car.animalFee || 30,
      childSeatFee: car.childSeatFee || 15,
      baseCity: car.baseCity || 'Львів'
    });
    try {
      setEditFeaturesList(car.features ? JSON.parse(car.features) : []);
    } catch (e) {
      setEditFeaturesList([]);
    }
  };

  return (
    <div className="admin-page-container pb-32">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Автопарк</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#e9c349] text-black font-bold rounded-lg hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Додати авто
        </button>
      </div>

      <div style={{ marginTop: '32px', display: 'grid', gap: '32px' }}>
        {loading ? <p>Завантаження...</p> : cars.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Немає автомобілів в базі</p> : (
          cars.map(car => (
            <div key={car.id} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Car Header */}
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>{car.make} {car.model}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                    {car.year} • {car.capacity} місць • {car.fuelType} • {car.fuelConsumptionCity}/{car.fuelConsumptionHighway} л/100км • €{car.baseRate}/км • База: {car.baseCity || 'Львів'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    backgroundColor: car.status === 'AVAILABLE' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.1)',
                    color: car.status === 'AVAILABLE' ? '#4ade80' : 'white',
                    borderRadius: '6px', fontSize: '12px', fontWeight: 'bold'
                  }}>{car.status === 'AVAILABLE' ? 'ДОСТУПНИЙ' : car.status}</span>
                  <button onClick={() => setReviewsModalOpen(car.id)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                    <Star size={16} className="text-[#e9c349]" /> Відгуки
                  </button>
                  <button onClick={() => handleDelete(car.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>Видалити</button>
                </div>
              </div>

              {/* Rich Content Editor (Description & Features) */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#e9c349] font-label-caps tracking-widest uppercase text-sm">Опис та Характеристики (SEO)</h3>
                  {editingCarId !== car.id ? (
                    <button onClick={() => openEditMode(car)} className="text-sm px-4 py-2 border border-white/20 rounded hover:bg-white/5 transition-colors">Редагувати тексти</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateCar(car.id)} className="text-sm px-4 py-2 bg-[#e9c349] text-black font-bold rounded hover:scale-105 transition-transform">Зберегти тексти</button>
                      <button onClick={() => setEditingCarId(null)} className="text-sm px-4 py-2 border border-white/20 rounded hover:bg-white/5 transition-colors">Скасувати</button>
                    </div>
                  )}
                </div>

                {editingCarId === car.id ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">База Авто (Місто)</label>
                        <input type="text" value={editFormData.baseCity || ''} onChange={e => setEditFormData({...editFormData, baseCity: e.target.value})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" placeholder="напр. Львів" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Багаж / Особа (€)</label>
                        <input type="number" step="0.01" value={editFormData.pricePerPerson} onChange={e => setEditFormData({...editFormData, pricePerPerson: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Кордон (€)</label>
                        <input type="number" step="0.01" value={editFormData.crossBorderFee} onChange={e => setEditFormData({...editFormData, crossBorderFee: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Табличка (€)</label>
                        <input type="number" step="0.01" value={editFormData.meetAndGreetFee} onChange={e => setEditFormData({...editFormData, meetAndGreetFee: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Тварини (€)</label>
                        <input type="number" step="0.01" value={editFormData.animalFee} onChange={e => setEditFormData({...editFormData, animalFee: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Крісло (€)</label>
                        <input type="number" step="0.01" value={editFormData.childSeatFee} onChange={e => setEditFormData({...editFormData, childSeatFee: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-400 mb-2">Детальний опис авто (HTML)</label>
                      <div className="bg-white text-black rounded-lg">
                        <ReactQuill theme="snow" value={editFormData.description || ''} onChange={val => setEditFormData({...editFormData, description: val})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-400 mb-2">Унікальні фішки (Features)</label>
                      <div className="space-y-2">
                        {editFeaturesList.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                            <input value={feature.icon} onChange={e => { const newF = [...editFeaturesList]; newF[idx].icon = e.target.value; setEditFeaturesList(newF); }} placeholder="Іконка (напр. wifi)" className="bg-transparent border border-white/20 rounded p-1 w-32 text-white text-sm" />
                            <input value={feature.text} onChange={e => { const newF = [...editFeaturesList]; newF[idx].text = e.target.value; setEditFeaturesList(newF); }} placeholder="Текст фішки (напр. Wi-Fi в салоні)" className="bg-transparent border border-white/20 rounded p-1 flex-1 text-white text-sm" />
                            <button onClick={() => { const newF = [...editFeaturesList]; newF.splice(idx, 1); setEditFeaturesList(newF); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        <button onClick={() => setEditFeaturesList([...editFeaturesList, { icon: 'star', text: '' }])} className="text-sm text-[#e9c349] hover:underline">+ Додати фішку</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-2">Опис</p>
                      {car.description ? (
                        <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: car.description }} />
                      ) : (
                        <p className="text-gray-600 italic">Опис відсутній</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-2">Фішки</p>
                      {car.features && car.features !== '[]' ? (
                        <ul className="space-y-2">
                          {JSON.parse(car.features).map((f: any, idx: number) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                              <span className="material-symbols-outlined text-[#e9c349] text-[18px]">{f.icon || 'star'}</span> {f.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 italic">Фішки не додані</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Media Gallery */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Фото та Відео</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ padding: '8px 16px', backgroundColor: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {uploading ? '⏳...' : <span className="flex items-center gap-1"><ImageIcon size={16} /> Фото</span>}
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                        onChange={e => { if (e.target.files?.[0]) handleMediaUpload(car.id, e.target.files[0], 'image'); }} />
                    </label>
                    <label style={{ padding: '8px 16px', backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {uploading ? '⏳...' : <span className="flex items-center gap-1"><Video size={16} /> Відео</span>}
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
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>Немає медіа файлів.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reviews Modal */}
      {reviewsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#e9c349] font-bold text-xl">Відгуки клієнтів</h2>
              <button onClick={() => setReviewsModalOpen(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            {/* List Existing Reviews */}
            <div className="space-y-4 mb-8">
              {cars.find(c => c.id === reviewsModalOpen)?.reviews?.length ? (
                cars.find(c => c.id === reviewsModalOpen)?.reviews?.map((review: any) => (
                  <div key={review.id} className="bg-white/5 p-4 rounded-lg relative">
                    <button onClick={() => handleDeleteReview(reviewsModalOpen, review.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white">{review.author}</span>
                      <span className="text-[#e9c349] flex">{Array(review.rating).fill('★').join('')}</span>
                    </div>
                    <p className="text-sm text-gray-300">{review.text}</p>
                    <span className="text-xs text-gray-500 block mt-2">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">Відгуків ще немає</p>
              )}
            </div>

            {/* Add New Review Form */}
            <form onSubmit={(e) => handleAddReview(e, reviewsModalOpen)} className="border-t border-white/10 pt-6">
              <h3 className="text-white font-bold mb-4">Додати відгук від імені клієнта</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">Ім'я клієнта</label>
                    <input required value={newReview.author} onChange={e => setNewReview({...newReview, author: e.target.value})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs uppercase text-gray-400 mb-1">Оцінка (1-5)</label>
                    <input type="number" min="1" max="5" required value={newReview.rating} onChange={e => setNewReview({...newReview, rating: e.target.value})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-1">Текст відгуку</label>
                  <textarea required value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} className="w-full bg-black/50 border border-white/20 rounded p-2 text-white h-24" />
                </div>
                <button type="submit" className="w-full py-3 bg-[#e9c349] text-black font-bold rounded hover:scale-[1.02] transition-transform">Опублікувати відгук</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Car Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', width: '480px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent-gold)' }}>Нове авто</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="col-span-2 border-b border-white/10 pb-2 mb-2">
                <h3 className="text-[#e9c349] font-bold text-sm uppercase">Основні дані</h3>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Марка</label>
                <input required value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>База авто (Місто)</label>
                <input required value={formData.baseCity} onChange={e => setFormData({...formData, baseCity: e.target.value})} placeholder="напр. Львів" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Модель</label>
                <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Рік</label>
                <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Місць</label>
                <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Базова ставка (€/км)</label>
                <input type="number" step="0.01" required value={formData.baseRate} onChange={e => setFormData({...formData, baseRate: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Тип палива</label>
                <select required value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }}>
                  <option value="Бензин">Бензин</option>
                  <option value="Дизель">Дизель</option>
                  <option value="Газ">Газ</option>
                  <option value="Електро">Електро</option>
                </select>
              </div>
              
              <div className="col-span-2 border-b border-white/10 pb-2 mt-4 mb-2">
                <h3 className="text-[#e9c349] font-bold text-sm uppercase">Коефіцієнти (€)</h3>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Багаж / Дод. особа</label>
                <input type="number" step="0.01" required value={formData.pricePerPerson} onChange={e => setFormData({...formData, pricePerPerson: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Перетин кордону</label>
                <input type="number" step="0.01" required value={formData.crossBorderFee} onChange={e => setFormData({...formData, crossBorderFee: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Зустріч з табличкою</label>
                <input type="number" step="0.01" required value={formData.meetAndGreetFee} onChange={e => setFormData({...formData, meetAndGreetFee: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Тварини</label>
                <input type="number" step="0.01" required value={formData.animalFee} onChange={e => setFormData({...formData, animalFee: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Дитяче крісло</label>
                <input type="number" step="0.01" required value={formData.childSeatFee} onChange={e => setFormData({...formData, childSeatFee: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }} />
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
