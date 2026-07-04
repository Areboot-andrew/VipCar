'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BadgeEuro,
  CarFront,
  CheckCircle2,
  Eye,
  FileText,
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
import CroppedImageUploader from '@/components/admin/CroppedImageUploader';
import DynamicIcon from '@/components/ui/DynamicIcon';
import HighlightedTitle from '@/components/ui/HighlightedTitle';
import { carSlug } from '@/lib/slug';

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
  pageBlocks?: string | null;
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
  pageBlocks: '[]',
  seoTitle: '',
  seoDescription: '',
  images: [],
  videos: [],
  media: [],
});

const tabs = [
  { id: 'main', label: 'Основне', icon: CarFront },
  { id: 'page', label: 'Сторінка', icon: FileText },
  { id: 'pricing', label: 'Тарифи', icon: BadgeEuro },
  { id: 'media', label: 'Медіа', icon: GalleryHorizontalEnd },
  { id: 'seo', label: 'Meta', icon: Search },
] as const;

type CarPageBlock = {
  id: string;
  type: 'headline' | 'text' | 'feature_grid' | 'media_text' | 'cta';
  title: string;
  text: string;
  icon: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
};

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

function stripHtml(value?: string | null) {
  return (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parsePageBlocks(value?: string | null, car?: CarRecord): CarPageBlock[] {
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}

  return [
    {
      id: `headline-${Date.now()}`,
      type: 'headline',
      title: car?.make ? `*${car.make}* ${car.model}` : '*Преміум* авто для трансферу',
      text: stripHtml(car?.description) || 'Короткий вступ для сторінки авто: кому підходить, для яких маршрутів і чим відрізняється.',
      icon: 'Sparkles',
      imageUrl: '',
      buttonText: '',
      buttonUrl: '',
      active: true,
    },
    {
      id: `features-${Date.now()}`,
      type: 'feature_grid',
      title: '*Особливості* авто',
      text: 'Переваги з іконками нижче редагуються окремо в цьому ж табі.',
      icon: 'BadgeCheck',
      imageUrl: '',
      buttonText: '',
      buttonUrl: '',
      active: true,
    },
    {
      id: `cta-${Date.now()}`,
      type: 'cta',
      title: 'Готові забронювати *цей клас*?',
      text: 'Перейдіть до калькулятора, вкажіть маршрут і бажаний час прибуття.',
      icon: 'Route',
      imageUrl: '',
      buttonText: 'Розрахувати маршрут',
      buttonUrl: '/#calculator',
      active: true,
    },
  ];
}

function newPageBlock(type: CarPageBlock['type']): CarPageBlock {
  const labels = {
    headline: '*Заголовок* сторінки',
    text: '*Текстовий* блок',
    feature_grid: '*Переваги* авто',
    media_text: '*Медіа* + текст',
    cta: 'Заклик до *бронювання*',
  };

  return {
    id: `${type}-${Date.now()}`,
    type,
    title: labels[type],
    text: '',
    icon: 'Sparkles',
    imageUrl: '',
    buttonText: type === 'cta' ? 'Розрахувати маршрут' : '',
    buttonUrl: type === 'cta' ? '/#calculator' : '',
    active: true,
  };
}

export default function AdminFleetPage() {
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<CarRecord>(emptyCar());
  const [features, setFeatures] = useState<{ icon: string; text: string }[]>([]);
  const [pageBlocks, setPageBlocks] = useState<CarPageBlock[]>([]);
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
      setPageBlocks(parsePageBlocks(next.pageBlocks, next));
      return;
    }
    if (selectedCar) {
      setDraft({ ...selectedCar });
      setFeatures(parseFeatures(selectedCar.features));
      setPageBlocks(parsePageBlocks(selectedCar.pageBlocks, selectedCar));
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
      description: pageBlocks.find((block) => block.type === 'headline')?.text || draft.description || '',
      pageBlocks: JSON.stringify(pageBlocks),
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

  const attachUploadedMedia = async (uploadData: { url: string; width?: number; height?: number }, type: 'image' | 'video') => {
    if (!draft.id) {
      setNotice('Спочатку збережи авто, потім додавай медіа.');
      return;
    }
    if (!uploadData.url) {
      setNotice('Не вдалося завантажити медіа.');
      return;
    }

    setUploading(true);

    try {
      const mediaRes = await fetch(`/api/cars/${draft.slug || draft.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadData.url,
          type,
          role: draft.media?.length ? 'gallery' : 'cover',
          isCover: !draft.media?.length,
          alt: `${draft.make} ${draft.model}`,
          width: uploadData.width,
          height: uploadData.height,
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

  const uploadVideo = async (file: File) => {
    if (!draft.id) {
      setNotice('Спочатку збережи авто, потім додавай медіа.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'video');

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) throw new Error('Upload failed');
      await attachUploadedMedia(uploadData, 'video');
      if (uploadData.note) setNotice(uploadData.note);
    } catch {
      setNotice('Не вдалося завантажити відео.');
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

  const updatePageBlock = (index: number, patch: Partial<CarPageBlock>) => {
    setPageBlocks((prev) => prev.map((block, itemIndex) => itemIndex === index ? { ...block, ...patch } : block));
  };

  const movePageBlock = (index: number, direction: -1 | 1) => {
    setPageBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-[#e9c349]">
        <Loader2 className="mr-3 animate-spin" /> Завантаження автопарку...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e4e2e3]">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
            <CarFront size={24} />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Автопарк і галерея</h1>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Авто з водіями, сторінки авто, медіа, комплектація і тарифи для розрахунку.</p>
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
                  <Field label="Марка" hint="Бренд автомобіля: Mercedes-Benz, BMW, Audi тощо. Показується клієнту і в адмінці."><input value={draft.make} onChange={(e) => updateDraft('make', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Модель" hint="Комерційна назва авто, наприклад S-Class W223 Long або V-Class VIP."><input value={draft.model} onChange={(e) => updateDraft('model', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Рік" hint="Рік випуску для карток, галереї і сторінки авто."><input type="number" value={draft.year} onChange={(e) => updateDraft('year', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Адреса сторінки" hint="URL для сторінки авто. Генерується автоматично, але можна виправити вручну."><input value={draft.slug || ''} onChange={(e) => updateDraft('slug', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Статус" hint="Доступний показується клієнтам; сервіс або у роботі прибирає авто з публічного вибору.">
                    <select value={draft.status} onChange={(e) => updateDraft('status', e.target.value)} className={inputClass()}>
                      <option value="AVAILABLE">Доступний</option>
                      <option value="MAINTENANCE">Сервіс</option>
                      <option value="IN_USE">У роботі</option>
                    </select>
                  </Field>
                  <Field label="Водій за замовчуванням" hint="Основний водій цього авто. Його ставка €/км і €/год використовується в калькуляторі витрат, якщо рейс не перепризначили вручну.">
                    <select value={draft.defaultDriverId || ''} onChange={(e) => updateDraft('defaultDriverId', e.target.value)} className={inputClass()}>
                      <option value="">Не призначено</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.user.name} • €{driver.salaryPerKm}/км</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Клас" hint="Клас для фільтрів клієнта: VIP, Business, Premium, Executive або власна назва."><input value={draft.comfortClass} onChange={(e) => updateDraft('comfortClass', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Кузов" hint="Тип авто: Sedan, Van, SUV, VIP Bus. Показується як характеристика."><input value={draft.bodyType || ''} onChange={(e) => updateDraft('bodyType', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Місць" hint="Максимальна кількість пасажирів. Калькулятор не покаже авто, якщо людей більше."><input type="number" value={draft.capacity} onChange={(e) => updateDraft('capacity', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Валіз" hint="Звичайні валізи, які авто нормально бере без втрати комфорту."><input type="number" value={draft.luggageCapacity} onChange={(e) => updateDraft('luggageCapacity', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Великих валіз" hint="Окрема оцінка для великого багажу, щоб менеджер бачив реальну місткість."><input type="number" value={draft.largeLuggageCapacity} onChange={(e) => updateDraft('largeLuggageCapacity', e.target.value)} className={inputClass()} /></Field>
                </div>

                <Field label="Опис багажу" hint="Людське пояснення для адміна і сторінки авто: наприклад, 2 великі валізи + ручна поклажа."><textarea rows={4} value={draft.luggageNote || ''} onChange={(e) => updateDraft('luggageNote', e.target.value)} className={`${inputClass()} admin-form-textarea resize-y`} /></Field>
              </div>
            )}

            {activeTab === 'page' && (
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#080818] p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Блоки сторінки авто</div>
                      <div className="text-xs text-[#8a8a93]">Заголовки підтримують акцент через зірочки: Преміум *трансфер*.</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ['headline', 'Заголовок'],
                        ['text', 'Текст'],
                        ['feature_grid', 'Переваги'],
                        ['media_text', 'Медіа'],
                        ['cta', 'CTA'],
                      ] as const).map(([type, label]) => (
                        <button key={type} onClick={() => setPageBlocks([...pageBlocks, newPageBlock(type)])} className="rounded-lg border border-[#e9c349]/30 px-3 py-2 text-xs font-bold text-[#e9c349] hover:bg-[#e9c349]/10">
                          + {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pageBlocks.map((block, index) => (
                    <div key={block.id} className={`rounded-xl border p-4 ${block.active ? 'border-white/10 bg-[#080818]' : 'border-white/5 bg-white/[0.02] opacity-60'}`}>
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
                            <DynamicIcon name={block.icon} size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">Блок #{index + 1}</div>
                            <div className="text-xs text-[#8a8a93]">{block.type}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => movePageBlock(index, -1)} className="rounded-lg bg-white/5 p-2 text-[#c7c6ca] hover:text-white"><ArrowUp size={16} /></button>
                          <button onClick={() => movePageBlock(index, 1)} className="rounded-lg bg-white/5 p-2 text-[#c7c6ca] hover:text-white"><ArrowDown size={16} /></button>
                          <button onClick={() => updatePageBlock(index, { active: !block.active })} className={`rounded-lg px-3 py-2 text-xs font-bold ${block.active ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-[#8a8a93]'}`}>{block.active ? 'Видимий' : 'Схований'}</button>
                          <button onClick={() => setPageBlocks(pageBlocks.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                        <Field label="Тип блоку" hint="Визначає, як блок виглядатиме на публічній сторінці авто.">
                          <select value={block.type} onChange={(e) => updatePageBlock(index, { type: e.target.value as CarPageBlock['type'] })} className={inputClass()}>
                            <option value="headline">Заголовок сторінки</option>
                            <option value="text">Текстовий блок</option>
                            <option value="feature_grid">Сітка переваг</option>
                            <option value="media_text">Медіа + текст</option>
                            <option value="cta">CTA / бронювання</option>
                          </select>
                        </Field>
                        <Field label="Іконка" hint="Виберіть символ для блоку або переваги. Іконки беруться з бібліотеки, без ручних SVG."><IconPicker value={block.icon} onChange={(value) => updatePageBlock(index, { icon: value })} /></Field>
                        <Field label="Заголовок" hint="Слово між *зірочками* буде золотим.">
                          <input value={block.title} onChange={(e) => updatePageBlock(index, { title: e.target.value })} className={inputClass()} placeholder="Mercedes-Benz *S-Class*" />
                        </Field>
                        <Field label="Текст" hint="Основний текст блоку. Без HTML: форматування робимо структурою блоків.">
                          <textarea rows={8} value={block.text} onChange={(e) => updatePageBlock(index, { text: e.target.value })} className={`${inputClass()} admin-form-textarea-lg resize-y`} placeholder="Текст блоку без HTML-хаосу." />
                        </Field>
                        {(block.type === 'media_text' || block.type === 'headline') && (
                          <Field label="URL зображення / відео" hint="Медіа для конкретного блоку сторінки, якщо воно відрізняється від галереї авто.">
                            <input value={block.imageUrl} onChange={(e) => updatePageBlock(index, { imageUrl: e.target.value })} className={inputClass()} placeholder="https://..." />
                          </Field>
                        )}
                        {block.type === 'cta' && (
                          <>
                            <Field label="Текст кнопки" hint="Що побачить клієнт на CTA-кнопці."><input value={block.buttonText} onChange={(e) => updatePageBlock(index, { buttonText: e.target.value })} className={inputClass()} /></Field>
                            <Field label="Посилання кнопки" hint="Зазвичай лишаємо /#calculator, система сама підставить вибране авто."><input value={block.buttonUrl} onChange={(e) => updatePageBlock(index, { buttonUrl: e.target.value })} className={inputClass()} /></Field>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <aside className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Eye size={16} className="text-[#e9c349]" /> Попередній перегляд</div>
                    <div className="space-y-4">
                      {pageBlocks.filter((block) => block.active).slice(0, 4).map((block) => (
                        <div key={block.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <div className="mb-2 flex items-center gap-2 text-[#e9c349]">
                            <DynamicIcon name={block.icon} size={16} />
                            <span className="text-xs uppercase tracking-widest">{block.type}</span>
                          </div>
                          <HighlightedTitle text={block.title} as="div" className="text-lg font-bold text-white" />
                          <p className="m-0 mt-2 line-clamp-3 text-xs leading-5 text-[#8a8a93]">{block.text || 'Текст блоку...'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-white/10 bg-[#080818] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">Переваги авто</div>
                        <div className="text-xs text-[#8a8a93]">Ці пункти рендеряться у блоці “Переваги”.</div>
                      </div>
                      <button onClick={() => setFeatures([...features, { icon: 'CircleCheck', text: '' }])} className="rounded-lg border border-[#e9c349]/30 px-3 py-2 text-xs font-bold text-[#e9c349] hover:bg-[#e9c349]/10">+ Додати</button>
                    </div>
                    {features.map((feature, index) => (
                      <div key={index} className="grid gap-2">
                        <IconPicker value={feature.icon} onChange={(value) => {
                          const next = [...features];
                          next[index].icon = value;
                          setFeatures(next);
                        }} />
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input value={feature.text} onChange={(e) => {
                            const next = [...features];
                            next[index].text = e.target.value;
                            setFeatures(next);
                          }} className={inputClass()} placeholder="Wi-Fi, вода, зарядки..." />
                          <button onClick={() => setFeatures(features.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid gap-5 lg:grid-cols-3">
                <Field label="Базова ставка €/км" hint="Клієнтська ставка авто за кілометр маршруту. Це основа ціни для конкретної машини."><input type="number" step="0.01" value={draft.baseRate} onChange={(e) => updateDraft('baseRate', e.target.value)} className={inputClass()} /></Field>
                <Field label="Пасажирів включено" hint="Скільки пасажирів входить у базову ціну без доплати за додаткову людину."><input type="number" step="1" value={draft.includedPassengers} onChange={(e) => updateDraft('includedPassengers', e.target.value)} className={inputClass()} /></Field>
                <Field label="Тип енергії" hint="Потрібно тільки для внутрішньої собівартості: пальне або зарядка по країнах маршруту.">
                  <select value={draft.fuelType} onChange={(e) => updateDraft('fuelType', e.target.value)} className={inputClass()}>
                    <option value="Бензин">Бензин</option>
                    <option value="Дизель">Дизель</option>
                    <option value="Газ">Газ</option>
                    <option value="Електро">Електро</option>
                  </select>
                </Field>
                <Field label="Бак / батарея" hint="Обʼєм бака або умовна ємність батареї. Використовується у внутрішньому розрахунку витрат."><input type="number" value={draft.fuelTankVolume} onChange={(e) => updateDraft('fuelTankVolume', e.target.value)} className={inputClass()} /></Field>
                <Field label="Внутр. норма місто" hint="Витрата у місті для собівартості. Клієнту це поле не показується."><input type="number" step="0.1" value={draft.fuelConsumptionCity} onChange={(e) => updateDraft('fuelConsumptionCity', e.target.value)} className={inputClass()} /></Field>
                <Field label="Внутр. норма траса" hint="Витрата на трасі для собівартості. Впливає на пальне і прибуток."><input type="number" step="0.1" value={draft.fuelConsumptionHighway} onChange={(e) => updateDraft('fuelConsumptionHighway', e.target.value)} className={inputClass()} /></Field>
                <Field label="Дод. пасажир / багаж €" hint="Доплата, якщо людей більше ніж включено або потрібна додаткова багажна логіка."><input type="number" step="0.01" value={draft.pricePerPerson} onChange={(e) => updateDraft('pricePerPerson', e.target.value)} className={inputClass()} /></Field>
                <Field label="Амортизація €/км" hint="Внутрішня витрата авто на кожен кілометр повного пробігу. Зменшує прибуток."><input type="number" step="0.01" value={draft.amortizationPerKm} onChange={(e) => updateDraft('amortizationPerKm', e.target.value)} className={inputClass()} /></Field>
                <Field label="Базова подача €" hint="Фіксована доплата/витрата за подачу саме цього авто до клієнта."><input type="number" step="0.01" value={draft.deliveryBaseFee} onChange={(e) => updateDraft('deliveryBaseFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Кордон €" hint="Надбавка для міжнародного рейсу. Клієнт не ставить галочку: система визначає кордон по маршруту."><input type="number" step="0.01" value={draft.crossBorderFee} onChange={(e) => updateDraft('crossBorderFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Зустріч з табличкою €" hint="Опція meet & greet, яку клієнт може обрати в калькуляторі."><input type="number" step="0.01" value={draft.meetAndGreetFee} onChange={(e) => updateDraft('meetAndGreetFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Тварини €" hint="Доплата за одну тварину, якщо авто дозволяє перевезення тварин."><input type="number" step="0.01" value={draft.animalFee} onChange={(e) => updateDraft('animalFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Дитяче крісло €" hint="Доплата за одне дитяче крісло."><input type="number" step="0.01" value={draft.childSeatFee} onChange={(e) => updateDraft('childSeatFee', e.target.value)} className={inputClass()} /></Field>
                <Field label="Діти дозволені" hint="Якщо вимкнено, калькулятор не покаже це авто для поїздки з дітьми."><input type="checkbox" checked={draft.allowsChildren} onChange={(e) => updateDraft('allowsChildren', e.target.checked)} className="h-5 w-5 accent-[#e9c349]" /></Field>
                <Field label="Тварини дозволені" hint="Якщо вимкнено, калькулятор не покаже це авто для поїздки з тваринами."><input type="checkbox" checked={draft.allowsAnimals} onChange={(e) => updateDraft('allowsAnimals', e.target.checked)} className="h-5 w-5 accent-[#e9c349]" /></Field>
                <Field label="Базове місто" hint="Звідки авто зазвичай стартує. Видно адмінам і використовується для логіки подачі."><input value={draft.baseCity || ''} onChange={(e) => updateDraft('baseCity', e.target.value)} className={inputClass()} /></Field>
                <Field label="Широта бази" hint="Координата бази авто для розрахунку подачі до клієнта."><input value={draft.baseLat || ''} onChange={(e) => updateDraft('baseLat', e.target.value)} className={inputClass()} /></Field>
                <Field label="Довгота бази" hint="Координата бази авто для розрахунку подачі до клієнта."><input value={draft.baseLng || ''} onChange={(e) => updateDraft('baseLng', e.target.value)} className={inputClass()} /></Field>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#080818] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Медіа-галерея авто</div>
                    <div className="text-xs text-[#8a8a93]">Обкладинка, опис, роль і порядок керують галереєю, сторінкою авто і картками на сайті.</div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <CroppedImageUploader
                      preset="fleet"
                      buttonLabel={uploading ? 'Завантаження...' : 'Фото з кадруванням'}
                      disabled={uploading || !draft.id}
                      value={(draft.media || []).find((item) => item.isCover)?.url || ''}
                      onUploaded={(data) => attachUploadedMedia(data, 'image')}
                    />
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
                      {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Відео
                      <input type="file" accept="video/*" className="hidden" disabled={uploading || !draft.id} onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
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
                        <Field label="Опис для зображення" hint="Коротко що на фото. Потрібно для доступності, пошуку і порядку в медіа."><input value={media.alt || ''} onChange={(e) => updateMediaDraft(index, { alt: e.target.value })} className={inputClass()} /></Field>
                        <Field label="Назва медіа" hint="Внутрішня назва для адмінки або підпису, якщо потрібно."><input value={media.title || ''} onChange={(e) => updateMediaDraft(index, { title: e.target.value })} className={inputClass()} /></Field>
                        <Field label="Роль фото" hint="Обкладинка, салон, зовнішній вигляд, багаж або загальна галерея.">
                          <select value={media.role} onChange={(e) => updateMediaDraft(index, { role: e.target.value })} className={inputClass()}>
                            <option value="cover">Обкладинка</option>
                            <option value="exterior">Екстерʼєр</option>
                            <option value="interior">Салон</option>
                            <option value="luggage">Багаж</option>
                            <option value="gallery">Галерея</option>
                          </select>
                        </Field>
                        <Field label="Порядок" hint="Менше число показується раніше. Обкладинка все одно має пріоритет."><input type="number" value={media.order} onChange={(e) => updateMediaDraft(index, { order: Number(e.target.value) })} className={inputClass()} /></Field>
                        <Field label="Підпис" hint="Текст під фото або у великому перегляді галереї."><textarea rows={3} value={media.caption || ''} onChange={(e) => updateMediaDraft(index, { caption: e.target.value })} className={`${inputClass()} min-h-[96px] resize-y lg:col-span-2`} /></Field>
                      </div>
                      <div className="flex flex-row gap-2 xl:flex-col">
                        <button onClick={() => updateMediaDraft(index, { isCover: !media.isCover })} className={`rounded-lg px-3 py-2 text-sm font-bold ${media.isCover ? 'bg-[#e9c349] text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>Обкладинка</button>
                        <button onClick={() => updateMediaDraft(index, { active: !media.active })} className={`rounded-lg px-3 py-2 text-sm font-bold ${media.active ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-[#8a8a93]'}`}>{media.active ? 'Видиме' : 'Сховане'}</button>
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
                  <Field label="Meta title" hint="Заголовок сторінки у браузері та пошуку. Якщо пусто, система збере з марки, моделі і року."><input value={draft.seoTitle || ''} onChange={(e) => updateDraft('seoTitle', e.target.value)} className={inputClass()} /></Field>
                  <Field label="Адреса сторінки" hint="URL сторінки авто. Має бути коротким і стабільним."><input value={draft.slug || ''} onChange={(e) => updateDraft('slug', e.target.value)} className={inputClass()} /></Field>
                </div>
                <Field label="Meta description" hint="Короткий опис для пошуку і превʼю. Не показується як основний текст сторінки."><textarea rows={6} value={draft.seoDescription || ''} onChange={(e) => updateDraft('seoDescription', e.target.value)} className={`${inputClass()} admin-form-textarea resize-y`} /></Field>
                <div className="rounded-lg border border-white/10 bg-[#080818] p-4">
                  <div className="mb-3 text-sm font-bold text-white">Попередній перегляд переваг</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-[#c7c6ca]">
                        <DynamicIcon name={feature.icon} size={18} className="text-[#e9c349]" />
                        {feature.text || 'Текст переваги'}
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
