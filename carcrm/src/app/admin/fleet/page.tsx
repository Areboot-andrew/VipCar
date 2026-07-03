'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  BadgeEuro,
  CarFront,
  CheckCircle2,
  GalleryHorizontalEnd,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import IconPicker from '@/components/admin/IconPicker';
import DynamicIcon from '@/components/ui/DynamicIcon';
import { carSlug } from '@/lib/slug';
import 'react-quill-new/dist/quill.snow.css';

const RichEditor = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="min-h-[160px] rounded-lg border border-white/10 bg-[#080818] p-4 text-[#8a8a93]">Завантаження редактора...</div>,
});

type CarMedia = {
  id: string;
  type: string;
  url: string;
  role: string;
  title?: string | null;
  alt?: string | null;
  caption?: string | null;
  order: number;
  isCover: boolean;
  active: boolean;
};

type Driver = {
  id: string;
  salaryPerKm: number;
  user: { name: string; email: string };
};

type CarRecord = {
  id?: string;
  slug?: string | null;
  make: string;
  model: string;
  year: number | string;
  capacity: number | string;
  luggageCapacity: number | string;
  largeLuggageCapacity: number | string;
  baseRate: number | string;
  fuelType: string;
  fuelConsumptionCity: number | string;
  fuelConsumptionHighway: number | string;
  fuelTankVolume: number | string;
  comfortClass: string;
  bodyType?: string | null;
  luggageNote?: string | null;
  status: string;
  includedPassengers: number | string;
  pricePerPerson: number | string;
  crossBorderFee: number | string;
  meetAndGreetFee: number | string;
  animalFee: number | string;
  childSeatFee: number | string;
  amortizationPerKm: number | string;
  deliveryBaseFee: number | string;
  allowsChildren: boolean;
  allowsAnimals: boolean;
  baseCity?: string | null;
  baseLat?: number | string | null;
  baseLng?: number | string | null;
  defaultDriverId?: string | null;
  description?: string | null;
  features?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images?: string[];
  videos?: string[];
  media?: CarMedia[];
};

const emptyCar = (): CarRecord => ({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  capacity: 4,
  luggageCapacity: 2,
  largeLuggageCapacity: 1,
  baseRate: 2.5,
  fuelType: 'Бензин',
  fuelConsumptionCity: 10,
  fuelConsumptionHighway: 7,
  fuelTankVolume: 60,
  comfortClass: 'Premium',
  bodyType: 'Sedan',
  luggageNote: '',
  status: 'AVAILABLE',
  includedPassengers: 1,
  pricePerPerson: 10,
  crossBorderFee: 150,
  meetAndGreetFee: 20,
  animalFee: 30,
  childSeatFee: 15,
  amortizationPerKm: 0.08,
  deliveryBaseFee: 0,
  allowsChildren: true,
  allowsAnimals: true,
  baseCity: 'Львів',
  baseLat: '',
  baseLng: '',
  defaultDriverId: '',
  description: '',
  features: '[]',
  seoTitle: '',
  seoDescription: '',
  images: [],
  videos: [],
  media: [],
});

const tabs = [
  { id: 'main', label: 'Основне', icon: CarFront },
  { id: 'pricing', label: 'Розрахунки', icon: BadgeEuro },
  { id: 'media', label: 'Медіа', icon: GalleryHorizontalEnd },
  { id: 'seo', label: 'SEO', icon: Search },
] as const;

function inputClass() {
  return 'w-full rounded-lg border border-white/10 bg-[#080818] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#64646d] focus:border-[#e9c349]';
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">{label}</label>
      {children}
      {hint && <p className="m-0 text-xs text-[#6f6f78]">{hint}</p>}
    </div>
  );
}

function parseFeatures(features?: string | null) {
  try {
    const parsed = JSON.parse(features || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminFleetPage() {
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<CarRecord>(emptyCar());
  const [features, setFeatures] = useState<{ icon: string; text: string }[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('main');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedCar = useMemo(() => cars.find((car) => car.id === selectedId), [cars, selectedId]);

  const fetchData = async () => {
    setLoading(true);
    const [carsRes, driversRes] = await Promise.all([
      fetch('/api/cars').then((res) => res.json()).catch(() => []),
      fetch('/api/drivers').then((res) => res.json()).catch(() => []),
    ]);
    setCars(Array.isArray(carsRes) ? carsRes : []);
    setDrivers(Array.isArray(driversRes) ? driversRes : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId === 'new') {
      const next = emptyCar();
      setDraft(next);
      setFeatures([]);
      return;
    }
    if (selectedCar) {
      setDraft({ ...selectedCar });
      setFeatures(parseFeatures(selectedCar.features));
    }
  }, [selectedId, selectedCar]);

  const updateDraft = (key: keyof CarRecord, value: any) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'make' || key === 'model' || key === 'year') {
        next.slug = carSlug(String(next.make || ''), String(next.model || ''), String(next.year || ''));
      }
      return next;
    });
  };

  const saveCar = async () => {
    setSaving(true);
    setNotice('');
    const payload = {
      ...draft,
      features: JSON.stringify(features),
    };
    const endpoint = draft.id ? `/api/cars/${draft.slug || draft.id}` : '/api/cars';
    const method = draft.id ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Save failed');
      setNotice('Авто збережено.');
      await fetchData();
      setSelectedId(saved.id);
    } catch {
      setNotice('Не вдалося зберегти авто.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCar = async (car: CarRecord) => {
    if (!car.id || !confirm(`Видалити ${car.make} ${car.model}?`)) return;
    const res = await fetch(`/api/cars/${car.slug || car.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedId('new');
      await fetchData();
    } else {
      setNotice('Не вдалося видалити авто. Можливо, є бронювання.');
    }
  };

  const uploadMedia = async (file: File, type: 'image' | 'video') => {
    if (!draft.id) {
      setNotice('Спочатку збережи авто, потім додавай медіа.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'fleet');

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error('Upload failed');

      const mediaRes = await fetch(`/api/cars/${draft.slug || draft.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadData.url,
          type,
          role: draft.media?.length ? 'gallery' : 'cover',
          isCover: !draft.media?.length,
          alt: `${draft.make} ${draft.model}`,
        }),
      });
      if (!mediaRes.ok) throw new Error('Media failed');
      await fetchData();
      setNotice('Медіа додано.');
    } catch {
      setNotice('Не вдалося завантажити медіа.');
    } finally {
      setUploading(false);
    }
  };

  const updateMediaDraft = (index: number, patch: Partial<CarMedia>) => {
    setDraft((prev) => {
      const media = [...(prev.media || [])];
      media[index] = { ...media[index], ...patch };
      if (patch.isCover) {
        media.forEach((item, itemIndex) => {
          if (itemIndex !== index) item.isCover = false;
        });
      }
      return { ...prev, media };
    });
  };

  const saveMedia = async () => {
    if (!draft.id) return;
    const res = await fetch(`/api/cars/${draft.slug || draft.id}/media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: draft.media || [] }),
    });
    if (res.ok) {
      setNotice('Медіа оновлено.');
      await fetchData();
    }
  };

  const deleteMedia = async (media: CarMedia) => {
    if (!draft.id || !confirm('Видалити медіа?')) return;
    const res = await fetch(`/api/cars/${draft.slug || draft.id}/media`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: media.id, url: media.url, mediaType: media.type }),
    });
    if (res.ok) {
      await fetchData();
      setNotice('Медіа видалено.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-[#e9c349]">
        <Loader2 className="mr-3 animate-spin" /> Завантаження автопарку...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080818] p-4 text-[#e4e2e3] md:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
            <CarFront size={24} />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Автопарк і галерея</h1>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Дані авто для калькулятора, SEO-сторінок і медіа-галереї.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {notice && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#c7c6ca]">
              <CheckCircle2 size={16} className="text-[#e9c349]" /> {notice}
            </div>
          )}
          <button onClick={() => setSelectedId('new')} className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/5">
            <Plus size={18} /> Нове авто
          </button>
          <button onClick={saveCar} disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black hover:scale-[1.02] disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Зберегти
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <aside className="h-fit rounded-xl border border-white/10 bg-[#13131a] p-3">
          <button onClick={() => setSelectedId('new')} className={`mb-3 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selectedId === 'new' ? 'border-[#e9c349]/40 bg-[#e9c349]/12' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e9c349] text-black"><Plus size={18} /></div>
            <div>
              <div className="text-sm font-bold text-white">Додати авто</div>
              <div className="text-xs text-[#8a8a93]">Повна картка для калькулятора</div>
            </div>
          </button>

          <div className="space-y-2">
            {cars.map((car) => {
              const cover = car.media?.find((item) => item.isCover) || car.media?.[0];
              const active = selectedId === car.id;
              return (
                <button key={car.id} onClick={() => setSelectedId(car.id!)} className={`flex w-full gap-3 rounded-lg border p-3 text-left transition-colors ${active ? 'border-[#e9c349]/40 bg-[#e9c349]/12' : 'border-transparent hover:bg-white/5'}`}>
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#080818]">
                    {cover ? <img src={cover.url} alt={cover.alt || `${car.make} ${car.model}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#64646d]"><ImageIcon size={18} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">{car.make} {car.model}</div>
                    <div className="mt-1 text-xs text-[#8a8a93]">{car.year} • {car.capacity} місць • {car.luggageCapacity || 2} валіз</div>
                    <div className="mt-2 text-xs text-[#e9c349]">€{car.baseRate}/км</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-xl border border-white/10 bg-[#13131a]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="m-0 text-xl font-bold text-white">
                {draft.id ? `${draft.make} ${draft.model}` : 'Нове авто'}
              </h2>
              <p className="m-0 mt-1 text-sm text-[#8a8a93]">
                {draft.slug || 'slug створиться автоматично'} {draft.id && `• /cars/${draft.slug || draft.id}`}
              </p>
            </div>
            {draft.id && (
              <button onClick={() => deleteCar(draft)} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20">
                <Trash2 size={16} /> Видалити
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${active ? 'bg-[#e9c349] text-black' : 'bg-white/5 text-[#c7c6ca] hover:text-white'}`}>
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {activeTab === 'main' && (
              <div className="space-y-6">
                <div className="grid gap-5 lg:grid-cols-3">
                  <Field label="Марка"><input value={draft.make} onChange={(e) => updateDraft('make', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Модель"><input value={draft.model} onChange={(e) => updateDraft('model', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Рік"><input type="number" value={draft.year} onChange={(e) => updateDraft('year', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Slug для Google"><input value={draft.slug || ''} onChange={(e) => updateDraft('slug', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Статус">
                    <select value={draft.status} onChange={(e) => updateDraft('status', e.target.value)} className={inputClass()}>
                      <option value="AVAILABLE">Доступний</option>
                      <option value="MAINTENANCE">Сервіс</option>
                      <option value="IN_USE">У роботі</option>
                    </select>
                  </Field>
                  <Field label="Клас"><input value={draft.comfortClass} onChange={(e) => updateDraft('comfortClass', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Кузов"><input value={draft.bodyType || ''} onChange={(e) => updateDraft('bodyType', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Місць"><input type="number" value={draft.capacity} onChange={(e) => updateDraft('capacity', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Валіз"><input type="number" value={draft.luggageCapacity} onChange={(e) => updateDraft('luggageCapacity', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Великих валіз"><input type="number" value={draft.largeLuggageCapacity} onChange={(e) => updateDraft('largeLuggageCapacity', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Тип пального">
                    <select value={draft.fuelType} onChange={(e) => updateDraft('fuelType', e.target.value)} className={inputClass()}>
                      <option value="Бензин">Бензин</option>
                      <option value="Дизель">Дизель</option>
                      <option value="Газ">Газ</option>
                      <option value="Електро">Електро</option>
                    </select>
                  </Field>
                  <Field label="Бак / батарея"><input type="number" value={draft.fuelTankVolume} onChange={(e) => updateDraft('fuelTankVolume', e.target.value)} className={inputClass()} /></Field>
                </div>

                <Field label="Опис багажу"><textarea rows={2} value={draft.luggageNote || ''} onChange={(e) => updateDraft('luggageNote', e.target.value)} className={`${inputClass()} resize-y`} /></Field>

                <Field label="Опис авто">
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-white text-black">
                    <RichEditor value={draft.description || ''} onChange={(value) => updateDraft('description', value)} />
                  </div>
                </Field>

                <div className="space-y-3 rounded-lg border border-white/10 bg-[#080818] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Фішки авто</div>
                      <div className="text-xs text-[#8a8a93]">Іконка + короткий текст для сторінки авто.</div>
                    </div>
                    <button onClick={() => setFeatures([...features, { icon: 'CircleCheck', text: '' }])} className="rounded-lg border border-[#e9c349]/30 px-3 py-2 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/10">+ Додати</button>
                  </div>
                  {features.map((feature, index) => (
                    <div key={index} className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
                      <IconPicker value={feature.icon} onChange={(value) => {
                        const next = [...features];
                        next[index].icon = value;
                        setFeatures(next);
                      }} />
                      <input value={feature.text} onChange={(e) => {
                        const next = [...features];
                        next[index].text = e.target.value;
                        setFeatures(next);
                      }} className={inputClass()} placeholder="Наприклад: Wi-Fi, вода, зарядки, дитяче крісло" />
                      <button onClick={() => setFeatures(features.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid gap-5 lg:grid-cols-3">
                <Field label="Базова ставка €/км"><input type="number" step="0.01" value={draft.baseRate} onChange={(e) => updateDraft('baseRate', e.target.value)} className={inputClass()} /></Field>
                <Field label="Пасажирів включено"><input type="number" step="1" value={draft.includedPassengers} onChange={(e) => updateDraft('includedPassengers', e.target.value)} className={inputClass()} /></Field>
                <Field label="Витрата місто"><input type="number" step="0.1" value={draft.fuelConsumptionCity} onChange={(e) => updateDraft('fuelConsumptionCity', e.target.value)} className={inputClass()} /></Field>
                <Field label="Витрата траса"><input type="number" step="0.1" value={draft.fuelConsumptionHighway} onChange={(e) => updateDraft('fuelConsumptionHighway', e.target.value)} className={inputClass()} /></Field>
                <Field label="Багаж / дод. особа €"><input type="number" step="0.01" value={draft.pricePerPerson} onChange={(e) => updateDraft('pricePerPerson', e.target.value)} className={inputClass()} /></Field>
                <Field label="Амортизація €/км"><input type="number" step="0.01" value={draft.amortizationPerKm} onChange={(e) => updateDraft('amortizationPerKm', e.target.value)} className={inputClass()} /></Field>
                <Field label="Базова подача €"><input type="number" step="0.01" value={draft.deliveryBaseFee} onChange={(e) => updateDraft('deliveryBaseFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Перетин кордону €"><input type="number" step="0.01" value={draft.crossBorderFee} onChange={(e) => updateDraft('crossBorderFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Зустріч з табличкою €"><input type="number" step="0.01" value={draft.meetAndGreetFee} onChange={(e) => updateDraft('meetAndGreetFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Тварини €"><input type="number" step="0.01" value={draft.animalFee} onChange={(e) => updateDraft('animalFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Дитяче крісло €"><input type="number" step="0.01" value={draft.childSeatFee} onChange={(e) => updateDraft('childSeatFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Діти дозволені"><input type="checkbox" checked={draft.allowsChildren} onChange={(e) => updateDraft('allowsChildren', e.target.checked)} className="h-5 w-5 accent-[#e9c349]" /></Field>
                <Field label="Тварини дозволені"><input type="checkbox" checked={draft.allowsAnimals} onChange={(e) => updateDraft('allowsAnimals', e.target.checked)} className="h-5 w-5 accent-[#e9c349]" /></Field>
                <Field label="Базове місто"><input value={draft.baseCity || ''} onChange={(e) => updateDraft('baseCity', e.target.value)} className={inputClass()} /></Field>
                <Field label="Base lat"><input value={draft.baseLat || ''} onChange={(e) => updateDraft('baseLat', e.target.value)} className={inputClass()} /></Field>
                <Field label="Base lng"><input value={draft.baseLng || ''} onChange={(e) => updateDraft('baseLng', e.target.value)} className={inputClass()} /></Field>
                <Field label="Водій за замовчуванням">
                  <select value={draft.defaultDriverId || ''} onChange={(e) => updateDraft('defaultDriverId', e.target.value)} className={inputClass()}>
                    <option value="">Не призначено</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.user.name} • €{driver.salaryPerKm}/км</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#080818] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Медіа-галерея авто</div>
                    <div className="text-xs text-[#8a8a93]">Cover, alt, caption і порядок потрібні для Google та красивої публічної галереї.</div>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
                      {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Фото
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'image')} />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
                      {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Відео
                      <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'video')} />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4">
                  {(draft.media || []).map((media, index) => (
                    <div key={media.id} className="grid gap-4 rounded-lg border border-white/10 bg-[#080818] p-4 xl:grid-cols-[180px_1fr_auto]">
                      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#13131a]">
                        {media.type === 'video' ? <video src={media.url} className="h-full w-full object-cover" muted /> : <img src={media.url} alt={media.alt || ''} className="h-full w-full object-cover" />}
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <Field label="Alt"><input value={media.alt || ''} onChange={(e) => updateMediaDraft(index, { alt: e.target.value })} className={inputClass()} /></Field>
                        <Field label="Title"><input value={media.title || ''} onChange={(e) => updateMediaDraft(index, { title: e.target.value })} className={inputClass()} /></Field>
                        <Field label="Role">
                          <select value={media.role} onChange={(e) => updateMediaDraft(index, { role: e.target.value })} className={inputClass()}>
                            <option value="cover">Cover</option>
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                            <option value="luggage">Luggage</option>
                            <option value="gallery">Gallery</option>
                          </select>
                        </Field>
                        <Field label="Порядок"><input type="number" value={media.order} onChange={(e) => updateMediaDraft(index, { order: Number(e.target.value) })} className={inputClass()} /></Field>
                        <Field label="Caption"><textarea rows={2} value={media.caption || ''} onChange={(e) => updateMediaDraft(index, { caption: e.target.value })} className={`${inputClass()} resize-y lg:col-span-2`} /></Field>
                      </div>
                      <div className="flex flex-row gap-2 xl:flex-col">
                        <button onClick={() => updateMediaDraft(index, { isCover: !media.isCover })} className={`rounded-lg px-3 py-2 text-sm font-bold ${media.isCover ? 'bg-[#e9c349] text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>Cover</button>
                        <button onClick={() => updateMediaDraft(index, { active: !media.active })} className={`rounded-lg px-3 py-2 text-sm font-bold ${media.active ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-[#8a8a93]'}`}>{media.active ? 'Visible' : 'Hidden'}</button>
                        <button onClick={() => deleteMedia(media)} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {(draft.media || []).length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-[#8a8a93]">
                      Збережи авто і додай перше фото. Воно стане cover для галереї та сторінки авто.
                    </div>
                  )}
                </div>
                {(draft.media || []).length > 0 && (
                  <button onClick={saveMedia} className="rounded-lg border border-[#e9c349]/40 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#e9c349] hover:bg-[#e9c349] hover:text-black">
                    Зберегти медіа
                  </button>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="SEO title"><input value={draft.seoTitle || ''} onChange={(e) => updateDraft('seoTitle', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Slug"><input value={draft.slug || ''} onChange={(e) => updateDraft('slug', e.target.value)} className={inputClass()} /></Field>
                </div>
                <Field label="SEO description"><textarea rows={4} value={draft.seoDescription || ''} onChange={(e) => updateDraft('seoDescription', e.target.value)} className={`${inputClass()} resize-y`} /></Field>
                <div className="rounded-lg border border-white/10 bg-[#080818] p-4">
                  <div className="mb-3 text-sm font-bold text-white">Preview features</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-[#c7c6ca]">
                        <DynamicIcon name={feature.icon} size={18} className="text-[#e9c349]" />
                        {feature.text || 'Feature text'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
