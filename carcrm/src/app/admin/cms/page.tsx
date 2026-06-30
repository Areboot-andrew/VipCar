'use client';

import { useState, useEffect } from 'react';

export default function CMSPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/cms')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (key: string, file: File) => {
    setUploadingState(prev => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        handleChange(key, data.url);
      } else {
        alert('Помилка завантаження файлу');
      }
    } catch (e) {
      console.error(e);
      alert('Помилка завантаження файлу');
    }
    setUploadingState(prev => ({ ...prev, [key]: false }));
  };

  const handleSave = async () => {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    if (res.ok) {
      alert('Зміни успішно збережено!');
    }
  };

  const mediaKeys = ['logo_url', 'hero_bg_image', 'hero_bg_video'];

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display-lg text-[#e9c349] mb-8">Управління контентом (CMS)</h1>
      
      <div className="bg-[#131314] rounded-2xl border border-white/10 p-8 space-y-6 max-w-4xl">
        {Object.entries(content).map(([key, value]) => {
          const isMedia = key.includes('image') || key.includes('video') || key.includes('logo');
          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-label-caps text-[#c7c6ca] uppercase tracking-widest">{key}</label>
              
              <div className="flex flex-col md:flex-row gap-4">
                {isMedia ? (
                  <>
                    <input 
                      type="text" 
                      value={value} 
                      onChange={e => handleChange(key, e.target.value)}
                      className="flex-1 bg-transparent border border-white/20 rounded-lg p-3 text-white focus:border-[#e9c349] outline-none"
                      placeholder="URL файлу (завантажте поруч)"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(key, e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept={key.includes('video') ? "video/*" : "image/*"}
                      />
                      <button disabled={uploadingState[key]} className="bg-[#353536] text-white px-6 py-3 rounded-lg w-full md:w-auto hover:bg-[#46474a] transition-colors disabled:opacity-50">
                        {uploadingState[key] ? 'Завантаження...' : 'Обрати файл'}
                      </button>
                    </div>
                  </>
                ) : (
                  <textarea 
                    value={value} 
                    onChange={e => handleChange(key, e.target.value)}
                    className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white focus:border-[#e9c349] outline-none min-h-[60px]"
                  />
                )}
              </div>
              
              {/* Preview Media */}
              {isMedia && value && (
                <div className="mt-2 w-48 h-32 bg-black rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                  {key.includes('video') ? (
                    <video src={value} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={value} alt={key} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-8 border-t border-white/10">
          <button 
            onClick={handleSave}
            className="gold-button font-bold text-sm px-8 py-4 rounded-lg uppercase tracking-widest"
          >
            Зберегти всі зміни
          </button>
        </div>
      </div>
    </div>
  );
}
