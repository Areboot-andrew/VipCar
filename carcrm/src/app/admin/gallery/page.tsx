'use client';

import React, { useState, useEffect } from 'react';

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export default function AdminGalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/cms');
      const data = await res.json();
      const content = data.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      if (content.standalone_gallery_media) {
        setMedia(JSON.parse(content.standalone_gallery_media));
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'standalone_gallery_media', value: JSON.stringify(media) })
      });
      alert('Галерею збережено!');
    } catch (e) {
      console.error(e);
      alert('Помилка збереження');
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'gallery');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        const type = data.url.match(/\.(mp4|webm)$/i) ? 'video' : 'image';
        setMedia([...media, { type, url: data.url }]);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Помилка завантаження файлу');
    }
    
    setUploading(false);
    e.target.value = ''; // Reset input
  };

  const removeMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  if (loading) return <div className="admin-page-container">Завантаження...</div>;

  return (
    <div className="admin-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--accent-gold)' }}>Управління Галереєю</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '12px 24px', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}
        >
          {saving ? 'Збереження...' : 'Зберегти Зміни'}
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Додайте сюди фото та відео, які не прив'язані до конкретних авто. Вони будуть відображатися в загальній галереї на головній сторінці сайту (разом із фото автомобілів з автопарку).
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#13131a',
            border: '1px solid var(--border-color)',
            color: 'white',
            borderRadius: '8px',
            cursor: uploading ? 'wait' : 'pointer'
          }}>
            {uploading ? 'Завантаження...' : '+ Додати Фото / Відео'}
            <input 
              type="file" 
              accept="image/*,video/mp4,video/webm" 
              style={{ display: 'none' }} 
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {media.map((item, index) => (
            <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', height: '150px' }}>
              {item.type === 'image' ? (
                <img src={item.url} alt={`Gallery ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
              )}
              <button 
                onClick={() => removeMedia(index)}
                style={{
                  position: 'absolute', top: '8px', right: '8px', 
                  backgroundColor: 'rgba(255,0,0,0.8)', color: 'white', 
                  border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'
                }}
              >
                Видалити
              </button>
            </div>
          ))}
          {media.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', gridColumn: '1 / -1' }}>Немає завантажених медіафайлів.</div>
          )}
        </div>
      </div>
    </div>
  );
}
