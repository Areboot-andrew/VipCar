'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, GripVertical, Save, ArrowUp, ArrowDown } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const RichEditor = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="text-black p-4">Завантаження редактора...</div>
});

type PageBlock = {
  id: string;
  order: number;
  type: string;
  content: string; // JSON string
  active: boolean;
};

export default function CMSPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/cms').then(res => res.json()),
      fetch('/api/page-blocks').then(res => res.json())
    ]).then(([cmsData, blocksData]) => {
      setContent(cmsData);
      setBlocks(blocksData || []);
      setLoading(false);
    });
  }, []);

  // --- Global Settings ---
  const handleGlobalChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleGlobalUpload = async (key: string, file: File) => {
    setUploadingState(prev => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'default');
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) handleGlobalChange(key, data.url);
    } catch (e) { console.error(e); }
    
    setUploadingState(prev => ({ ...prev, [key]: false }));
  };

  const handleSaveGlobal = async () => {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    if (res.ok) alert('Глобальні налаштування збережено!');
  };

  // --- Block Builder ---
  const addBlock = async (type: string) => {
    const defaultContent = type === 'HERO' ? { title: 'Новий Банер', subtitle: 'Опис банеру', bgImage: '' } :
                           type === 'GALLERY' ? { title: 'Галерея', items: [] } :
                           type === 'TEXT_IMAGE' ? { title: 'Заголовок', text: 'Текст', image: '', imagePosition: 'left' } :
                           type === 'FEATURES' ? { title: 'Переваги', items: [] } : {};
    
    const res = await fetch('/api/page-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: JSON.stringify(defaultContent) })
    });
    const newBlock = await res.json();
    if (newBlock.id) setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Видалити цей блок?')) return;
    await fetch(`/api/page-blocks?id=${id}`, { method: 'DELETE' });
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newBlocks[index].order;
    newBlocks[index].order = newBlocks[targetIndex].order;
    newBlocks[targetIndex].order = temp;
    
    // Sort array by order
    newBlocks.sort((a, b) => a.order - b.order);
    setBlocks(newBlocks);
  };

  const updateBlockContent = (index: number, newContentObj: any) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = JSON.stringify(newContentObj);
    setBlocks(newBlocks);
  };

  const saveBlocks = async () => {
    const res = await fetch('/api/page-blocks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blocks)
    });
    if (res.ok) alert('Структуру сторінки збережено!');
  };

  const handleBlockImageUpload = async (blockIndex: number, fieldPath: (content: any, url: string) => void, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'block_media');
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const parsed = JSON.parse(blocks[blockIndex].content);
        fieldPath(parsed, data.url);
        updateBlockContent(blockIndex, parsed);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display-lg text-[#e9c349]">Управління сайтом (CMS)</h1>
      </div>
      
      {/* Visual Block Builder */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Структура головної сторінки (Блоки)</h2>
          <button onClick={saveBlocks} className="flex items-center gap-2 bg-[#e9c349] text-black font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform">
            <Save size={18} /> Зберегти блоки
          </button>
        </div>

        <div className="flex gap-4 mb-8 p-4 bg-[#13131a] border border-white/10 rounded-xl">
          <span className="text-[#8a8a93] text-sm uppercase tracking-widest font-bold self-center mr-4">Додати блок:</span>
          <button onClick={() => addBlock('HERO')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">+ Hero-Банер</button>
          <button onClick={() => addBlock('TEXT_IMAGE')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">+ Текст + Зображення (Блог)</button>
          <button onClick={() => addBlock('GALLERY')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">+ Галерея (Карусель)</button>
          <button onClick={() => addBlock('FEATURES')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">+ Переваги</button>
        </div>

        <div className="space-y-6">
          {blocks.length === 0 && <p className="text-[#8a8a93] italic">Немає жодного блоку. Додайте перший блок вище.</p>}
          
          {blocks.map((block, index) => {
            let parsed = {};
            try { parsed = JSON.parse(block.content); } catch (e) {}

            return (
              <div key={block.id} className="bg-[#13131a] rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col md:flex-row">
                
                {/* Block Controls */}
                <div className="bg-[#1a1a24] p-4 flex md:flex-col items-center justify-between md:justify-start gap-4 border-b md:border-b-0 md:border-r border-white/5 w-full md:w-16 shrink-0">
                  <div className="text-[#8a8a93] font-bold text-xs">{index + 1}</div>
                  <div className="flex md:flex-col gap-2">
                    <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                  <button onClick={() => deleteBlock(block.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded mt-auto"><Trash2 size={16} /></button>
                </div>

                {/* Block Editor */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#e9c349] font-bold tracking-widest uppercase text-xs px-3 py-1 bg-[#e9c349]/10 rounded-full">{block.type} BLOCK</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={block.active} 
                        onChange={(e) => {
                          const newBlocks = [...blocks];
                          newBlocks[index].active = e.target.checked;
                          setBlocks(newBlocks);
                        }}
                      />
                      <span className="text-sm text-white">Активний</span>
                    </label>
                  </div>

                  {/* Render Editor Based on Type */}
                  {block.type === 'HERO' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Заголовок</label>
                        <input type="text" className="w-full bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).title || ''} onChange={e => updateBlockContent(index, { ...parsed, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Підзаголовок</label>
                        <input type="text" className="w-full bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).subtitle || ''} onChange={e => updateBlockContent(index, { ...parsed, subtitle: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Фонове зображення/відео</label>
                        <div className="flex gap-4">
                          <input type="text" className="flex-1 bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).bgImage || ''} onChange={e => updateBlockContent(index, { ...parsed, bgImage: e.target.value })} />
                          <label className="bg-[#353536] text-white px-6 py-3 rounded hover:bg-[#46474a] cursor-pointer">
                            Завантажити
                            <input type="file" className="hidden" onChange={e => e.target.files && handleBlockImageUpload(index, (c, url) => c.bgImage = url, e.target.files[0])} />
                          </label>
                        </div>
                        {(parsed as any).bgImage && <img src={(parsed as any).bgImage} className="mt-2 h-20 rounded border border-white/10" />}
                      </div>
                    </div>
                  )}

                  {block.type === 'TEXT_IMAGE' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Заголовок блоку</label>
                        <input type="text" className="w-full bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).title || ''} onChange={e => updateBlockContent(index, { ...parsed, title: e.target.value })} />
                      </div>
                      <div className="bg-white text-black rounded">
                        <RichEditor value={(parsed as any).text || ''} onChange={val => updateBlockContent(index, { ...parsed, text: val })} />
                      </div>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-[#8a8a93] uppercase">Зображення</label>
                          <div className="flex gap-4">
                            <input type="text" className="flex-1 bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).image || ''} onChange={e => updateBlockContent(index, { ...parsed, image: e.target.value })} />
                            <label className="bg-[#353536] text-white px-6 py-3 rounded hover:bg-[#46474a] cursor-pointer">
                              Завантажити
                              <input type="file" className="hidden" onChange={e => e.target.files && handleBlockImageUpload(index, (c, url) => c.image = url, e.target.files[0])} />
                            </label>
                          </div>
                        </div>
                        <div className="shrink-0">
                           <label className="text-xs text-[#8a8a93] uppercase block mb-1">Позиція фото</label>
                           <select className="bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).imagePosition || 'left'} onChange={e => updateBlockContent(index, { ...parsed, imagePosition: e.target.value })}>
                             <option value="left">Зліва</option>
                             <option value="right">Справа</option>
                           </select>
                        </div>
                      </div>
                      {(parsed as any).image && <img src={(parsed as any).image} className="mt-2 h-20 rounded border border-white/10" />}
                    </div>
                  )}
                  
                  {block.type === 'GALLERY' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Заголовок галереї</label>
                        <input type="text" className="w-full bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).title || ''} onChange={e => updateBlockContent(index, { ...parsed, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase mb-2 block">Медіафайли галереї</label>
                        <div className="flex flex-wrap gap-4">
                           {((parsed as any).items || []).map((url: string, i: number) => (
                             <div key={i} className="relative w-32 h-32 border border-white/10 rounded overflow-hidden bg-black group">
                               <img src={url} className="w-full h-full object-cover" />
                               <button onClick={() => { const newItems = [...((parsed as any).items || [])]; newItems.splice(i, 1); updateBlockContent(index, { ...parsed, items: newItems }); }} className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                             </div>
                           ))}
                           <label className="w-32 h-32 border border-dashed border-white/30 rounded flex items-center justify-center text-white/50 hover:bg-white/5 cursor-pointer hover:border-white/60 transition-colors">
                              + Додати
                              <input type="file" className="hidden" onChange={e => e.target.files && handleBlockImageUpload(index, (c, url) => { if(!c.items) c.items = []; c.items.push(url); }, e.target.files[0])} />
                           </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === 'FEATURES' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#8a8a93] uppercase">Заголовок блоку переваг</label>
                        <input type="text" className="w-full bg-[#080818] border border-white/10 p-3 rounded text-white" value={(parsed as any).title || ''} onChange={e => updateBlockContent(index, { ...parsed, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        {((parsed as any).items || []).map((feat: any, i: number) => (
                          <div key={i} className="flex gap-2 items-center bg-[#080818] p-3 rounded border border-white/10">
                            <span className="material-symbols-outlined text-[#e9c349]">{feat.icon || 'star'}</span>
                            <input type="text" placeholder="Іконка (material id)" className="w-32 bg-transparent text-white border-b border-white/20 p-1" value={feat.icon || ''} onChange={e => { const items = [...(parsed as any).items]; items[i].icon = e.target.value; updateBlockContent(index, { ...parsed, items }); }} />
                            <input type="text" placeholder="Назва" className="w-48 bg-transparent text-white border-b border-white/20 p-1" value={feat.title || ''} onChange={e => { const items = [...(parsed as any).items]; items[i].title = e.target.value; updateBlockContent(index, { ...parsed, items }); }} />
                            <input type="text" placeholder="Опис" className="flex-1 bg-transparent text-white border-b border-white/20 p-1" value={feat.desc || ''} onChange={e => { const items = [...(parsed as any).items]; items[i].desc = e.target.value; updateBlockContent(index, { ...parsed, items }); }} />
                            <button onClick={() => { const items = [...(parsed as any).items]; items.splice(i, 1); updateBlockContent(index, { ...parsed, items }); }} className="text-red-400 p-2 hover:bg-red-400/20 rounded"><Trash2 size={16}/></button>
                          </div>
                        ))}
                        <button onClick={() => { const items = [...((parsed as any).items || [])]; items.push({ icon: 'check', title: '', desc: '' }); updateBlockContent(index, { ...parsed, items }); }} className="text-sm text-[#e9c349] hover:underline">+ Додати перевагу</button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Global Settings (Old CMS format) */}
      <h2 className="text-2xl font-bold text-white mb-6">Глобальні константи сайту</h2>
      <div className="bg-[#080818] rounded-2xl border border-white/10 p-8 space-y-6 max-w-4xl opacity-80 hover:opacity-100 transition-opacity">
        <p className="text-[#8a8a93] text-sm mb-4">Тут зберігаються старі ключі та глобальні налаштування (наприклад, logo_url, телефони). Це залишено для сумісності.</p>
        {Object.entries(content).map(([key, value]) => {
          const isMedia = key.includes('image') || key.includes('video') || key.includes('logo');
          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-label-caps text-[#c7c6ca] uppercase tracking-widest">{key}</label>
              <div className="flex flex-col md:flex-row gap-4">
                {isMedia ? (
                  <>
                    <input type="text" value={value} onChange={e => handleGlobalChange(key, e.target.value)} className="flex-1 bg-transparent border border-white/20 rounded-lg p-3 text-white focus:border-[#e9c349] outline-none" />
                    <div className="relative">
                      <input type="file" onChange={(e) => { if (e.target.files && e.target.files[0]) handleGlobalUpload(key, e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <button disabled={uploadingState[key]} className="bg-[#353536] text-white px-6 py-3 rounded-lg w-full md:w-auto hover:bg-[#46474a] transition-colors disabled:opacity-50">
                        {uploadingState[key] ? 'Завантаження...' : 'Обрати файл'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white text-black rounded-lg overflow-hidden w-full">
                    <RichEditor value={value} onChange={(val) => handleGlobalChange(key, val)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="pt-8 border-t border-white/10">
          <button onClick={handleSaveGlobal} className="border border-[#e9c349] text-[#e9c349] hover:bg-[#e9c349] hover:text-black font-bold text-sm px-8 py-4 rounded-lg uppercase tracking-widest transition-colors">
            Зберегти глобальні зміни
          </button>
        </div>
      </div>
    </div>
  );
}
