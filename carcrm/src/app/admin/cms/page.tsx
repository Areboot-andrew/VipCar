'use client';

import { useEffect, useState } from 'react';

const CMS_KEYS = [
  { key: 'hero_title', label: 'Заголовок на головній (Hero)' },
  { key: 'hero_subtitle', label: 'Підзаголовок на головній (Hero)' },
  { key: 'hero_btn_text', label: 'Текст кнопки "Забронювати"' },
  { key: 'services_title', label: 'Заголовок блоку "Чому ми?"' },
  { key: 'calculator_title', label: 'Заголовок Калькулятора' },
  { key: 'fleet_title', label: 'Заголовок Автопарку' },
  { key: 'contact_title', label: 'Заголовок форми контактів' },
  { key: 'contact_desc', label: 'Опис форми контактів' },
  { key: 'contact_phone', label: 'Телефон у підвалі' },
  { key: 'contact_email', label: 'Email у підвалі' },
];

export default function AdminCMSPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/cms')
      .then(res => res.json())
      .then((data: any[]) => {
        const map: Record<string, string> = {};
        data.forEach(item => { map[item.key] = item.value; });
        setContent(map);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: content[key] || '' })
      });
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-page-container"><p>Завантаження...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>CMS: Управління контентом сайту</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Змінюйте тексти, які відображатимуться клієнтам на головній сторінці.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
        {CMS_KEYS.map(item => (
          <div key={item.key} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-gold)' }}>
              {item.label}
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <input
                type="text"
                value={content[item.key] || ''}
                onChange={e => handleChange(item.key, e.target.value)}
                placeholder="Текст за замовчуванням..."
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
              />
              <button 
                onClick={() => handleSave(item.key)}
                disabled={saving}
                style={{ padding: '0 24px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Зберегти
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
