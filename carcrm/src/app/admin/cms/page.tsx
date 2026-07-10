'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  CheckCircle2,
  Eye,
  FileText,
  GalleryHorizontalEnd,
  Globe2,
  LayoutTemplate,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import IconPicker from '@/components/admin/IconPicker';
import MediaField from '@/components/admin/MediaField';
import DynamicIcon from '@/components/ui/DynamicIcon';
import HighlightedTitle from '@/components/ui/HighlightedTitle';
import { SITE_CONTENT_DEFAULTS, withContentDefaults } from '@/lib/contentDefaults';
import 'react-quill-new/dist/quill.snow.css';

const RichEditor = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="min-h-[180px] rounded-lg border border-white/10 bg-[#080818] p-4 text-[#8a8a93]">Завантаження редактора...</div>,
});

type PageBlock = {
  id: string;
  order: number;
  type: string;
  content: string;
  active: boolean;
};

type FieldConfig = {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'textarea' | 'media' | 'secret';
  preview?: boolean;
  mediaPreset?: string;
  mediaAspect?: number;
  mediaCrop?: boolean;
  mediaAllowVideo?: boolean;
};

// Sensible crop/preset defaults per media field, overridable via FieldConfig.
function mediaOptionsFor(field: FieldConfig) {
  const key = field.key.toLowerCase();
  const isLogo = key.includes('logo');
  const isBg = key.includes('bg') || key.includes('hero');
  return {
    preset: field.mediaPreset ?? (isBg ? 'hero' : 'gallery'),
    aspect: field.mediaAspect,
    crop: field.mediaCrop ?? !isLogo, // logos are optimized without forced crop
    allowVideo: field.mediaAllowVideo ?? (isBg || key.includes('video')),
  };
}

const tabs = [
  { id: 'home', label: 'Головна', desc: 'Hero, меню, переваги', icon: LayoutTemplate },
  { id: 'blocks', label: 'Блоки', desc: 'Конструктор секцій', icon: Blocks },
  { id: 'contacts', label: 'Контакти', desc: 'Форма, footer, CTA', icon: Mail },
  { id: 'seo', label: 'Meta', desc: 'Пошук і schema', icon: Search },
  { id: 'technical', label: 'Технічні', desc: 'Решта ключів', icon: Settings2 },
] as const;

const homeFields: FieldConfig[] = [
  { key: 'brand_name', label: 'Назва бренду', hint: 'Використовується у шапці, footer і службових підписах.' },
  { key: 'logo_url', label: 'Логотип', type: 'media', hint: 'Основний логотип сайту. Краще PNG/WebP з прозорим або темним фоном.' },
  { key: 'menu_services', label: 'Меню: послуги', hint: 'Текст пункту навігації у шапці.' },
  { key: 'menu_fleet', label: 'Меню: автопарк', hint: 'Текст пункту, який веде до автомобілів.' },
  { key: 'menu_gallery', label: 'Меню: галерея', hint: 'Текст пункту, який веде до галереї автопарку.' },
  { key: 'menu_contact', label: 'Меню: контакти', hint: 'Текст пункту контактного блоку.' },
  { key: 'menu_login', label: 'Меню: вхід', hint: 'Показується неавторизованому користувачу.' },
  { key: 'menu_profile', label: 'Меню: профіль', hint: 'Показується авторизованому клієнту.' },
  { key: 'menu_driver_cabinet', label: 'Меню: кабінет водія', hint: 'Показується користувачу з роллю водія.' },
  { key: 'menu_logout', label: 'Меню: вихід', hint: 'Текст кнопки виходу з акаунта.' },
  { key: 'btn_book_now', label: 'Кнопка в шапці', hint: 'Головна кнопка швидкого переходу до бронювання.' },
  { key: 'btn_hero_cta', label: 'Головна CTA-кнопка', hint: 'Кнопка в першому екрані головної сторінки.' },
  { key: 'hero_title', label: 'Hero заголовок', type: 'textarea', preview: true, hint: 'Золотий акцент: *текст*. Новий рядок теж підтримується.' },
  { key: 'hero_subtitle', label: 'Hero підзаголовок', type: 'textarea', hint: 'Можна виділяти слова через *зірочки*.' },
  { key: 'hero_bg_image', label: 'Hero фон', type: 'media', hint: 'Фонове зображення першого екрана, якщо відео не задане або не завантажилось.' },
  { key: 'hero_bg_video', label: 'Hero відео', type: 'media', hint: 'Відеофон першого екрана. Має бути коротким і оптимізованим.' },
  { key: 'services_title', label: 'Заголовок переваг', preview: true, hint: 'Наприклад: Чому обирають *нас*?' },
  { key: 'gallery_title', label: 'Заголовок галереї', preview: true, hint: 'Заголовок блоку галереї на головній сторінці.' },
  { key: 'gallery_subtitle', label: 'Опис галереї', type: 'textarea', hint: 'Короткий клієнтський опис автопарку, без технічних приміток.' },
  { key: 'loading_calculator', label: 'Текст завантаження калькулятора', hint: 'Показується, поки форма бронювання підтягує дані.' },
];

const contactFields: FieldConfig[] = [
  { key: 'contact_section_title', label: 'Заголовок форми' },
  { key: 'contact_section_subtitle', label: 'Опис форми', type: 'textarea' },
  { key: 'contact_success_title', label: 'Success заголовок' },
  { key: 'contact_success_message', label: 'Success повідомлення', type: 'textarea' },
  { key: 'contact_name_label', label: 'Label: імʼя' },
  { key: 'contact_name_placeholder', label: 'Placeholder: імʼя' },
  { key: 'contact_phone_label', label: 'Label: телефон' },
  { key: 'contact_phone_placeholder', label: 'Placeholder: телефон' },
  { key: 'contact_email_label', label: 'Label: email' },
  { key: 'contact_email_placeholder', label: 'Placeholder: email' },
  { key: 'contact_message_label', label: 'Label: повідомлення' },
  { key: 'contact_message_placeholder', label: 'Placeholder: повідомлення' },
  { key: 'contact_submit', label: 'Кнопка форми' },
  { key: 'contact_submitting', label: 'Кнопка під час відправки' },
  { key: 'contact_phone', label: 'Телефон у footer' },
  { key: 'contact_email', label: 'Email у footer' },
  { key: 'footer_text', label: 'Опис у footer', type: 'textarea' },
  { key: 'footer_menu_title', label: 'Footer: меню' },
  { key: 'footer_contacts_title', label: 'Footer: контакти' },
  { key: 'footer_rights', label: 'Footer: права' },
  { key: 'empty_legs_title', label: 'Empty Legs заголовок', preview: true },
  { key: 'empty_legs_anywhere', label: 'Empty Legs: будь-яке місто' },
  { key: 'empty_legs_book_button', label: 'Empty Legs: кнопка' },
];

const seoFields: FieldConfig[] = [
  { key: 'site_meta_title', label: 'Meta title', hint: 'Заголовок сайту для браузера і пошукової видачі.' },
  { key: 'site_meta_description', label: 'Meta description', type: 'textarea', hint: 'Короткий опис для пошукової видачі. Це не текст у hero.' },
  { key: 'site_meta_keywords', label: 'Meta keywords', type: 'textarea', hint: 'Додаткові ключові фрази через кому, якщо треба підтримати стару пошукову логіку.' },
  { key: 'site_og_title', label: 'OpenGraph title', hint: 'Заголовок для превʼю у месенджерах і соцмережах.' },
  { key: 'site_og_description', label: 'OpenGraph description', type: 'textarea', hint: 'Опис для превʼю посилання у месенджерах і соцмережах.' },
  { key: 'site_url', label: 'URL сайту', hint: 'Основний домен без зайвих шляхів. Потрібен для canonical і schema.' },
  { key: 'schema_description', label: 'Schema description', type: 'textarea', hint: 'Службовий опис компанії для структурованих даних.' },
  { key: 'schema_price_range', label: 'Schema price range', hint: 'Діапазон цін для Google schema, наприклад €€€.' },
  { key: 'schema_address_city', label: 'Schema місто', hint: 'Місто базової адреси компанії у structured data.' },
  { key: 'schema_address_country', label: 'Schema країна', hint: 'Країна базової адреси компанії у structured data.' },
  { key: 'schema_area_served', label: 'Країни обслуговування', hint: 'Через кому: UA,PL,DE...' },
  { key: 'gallery_seo_title', label: 'Meta title галереї', hint: 'Окремий заголовок сторінки галереї для браузера і пошуку.' },
  { key: 'gallery_seo_description', label: 'Meta description галереї', type: 'textarea', hint: 'Короткий опис сторінки галереї для пошуку. Не показуємо як hero-текст.' },
];

const explicitKeys = new Set([
  ...homeFields.map((field) => field.key),
  ...contactFields.map((field) => field.key),
  ...seoFields.map((field) => field.key),
  ...Array.from({ length: 4 }).flatMap((_, index) => [
    `feature_${index + 1}_icon`,
    `feature_${index + 1}_title`,
    `feature_${index + 1}_desc`,
  ]),
]);

const blockLabels: Record<string, string> = {
  HERO: 'Hero банер',
  INFO: 'Інформація (фото + текст)',
  TEXT_IMAGE: 'Текст + медіа',
  GALLERY: 'Галерея',
  FEATURES: 'Переваги',
};

function parseBlockContent(content: string) {
  try {
    return JSON.parse(content || '{}');
  } catch {
    return {};
  }
}

function fieldClass() {
  return 'w-full rounded-lg border border-white/10 bg-[#080818] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#64646d] focus:border-[#e9c349]';
}

function SectionShell({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#13131a]">
      <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="m-0 text-lg font-bold text-white">{title}</h2>
          {desc && <p className="m-0 mt-1 text-sm text-[#8a8a93]">{desc}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function CmsField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  uploading?: boolean;
  onChange: (value: string) => void;
  onUpload?: (file: File) => void;
}) {
  const inputId = `cms-${field.key}`;
  const isMedia = field.type === 'media';

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea id={inputId} rows={6} value={value || ''} onChange={(event) => onChange(event.target.value)} className={`${fieldClass()} admin-form-textarea resize-y`} />
      ) : isMedia ? (
        <MediaField value={value} onChange={onChange} {...mediaOptionsFor(field)} />
      ) : (
        <input
          id={inputId}
          type={field.type === 'secret' ? 'password' : 'text'}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClass()}
        />
      )}
      {field.hint && <p className="m-0 text-xs text-[#6f6f78]">{field.hint}</p>}
      {field.preview && value && (
        <div className="rounded-lg border border-white/10 bg-[#080818] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f78]">Попередній перегляд</div>
          <HighlightedTitle text={value} as="div" className="text-xl font-bold text-white" />
        </div>
      )}
    </div>
  );
}

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('home');
  const [content, setContent] = useState<Record<string, string>>(withContentDefaults());
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/cms').then((res) => res.json()),
      fetch('/api/page-blocks').then((res) => res.json()),
    ])
      .then(([cmsData, blocksData]) => {
        setContent(withContentDefaults(cmsData));
        setBlocks(Array.isArray(blocksData) ? blocksData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const technicalKeys = useMemo(() => {
    return Object.keys(content)
      .filter((key) => !explicitKeys.has(key))
      .sort((a, b) => a.localeCompare(b));
  }, [content]);

  const updateContent = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (file: File, type = 'cms_media') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error('Upload failed');
    return data.url as string;
  };

  const handleGlobalUpload = async (key: string, file: File) => {
    setUploadingState((prev) => ({ ...prev, [key]: true }));
    try {
      const url = await uploadFile(file);
      updateContent(key, url);
    } catch {
      setNotice('Не вдалося завантажити файл.');
    } finally {
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  const addBlock = async (type: string) => {
    const defaultContent =
      type === 'HERO'
        ? { title: 'Новий *банер*', subtitle: 'Опис банеру', bgImage: '' }
        : type === 'INFO'
          ? { title: 'Про наш сервіс', subtitle: '', items: [{ title: '', text: 'Опис…', image: '' }] }
        : type === 'GALLERY'
          ? { title: 'Галерея', items: [] }
          : type === 'TEXT_IMAGE'
            ? { title: 'Заголовок', text: 'Текст', image: '', imagePosition: 'left' }
            : type === 'FEATURES'
              ? { title: 'Переваги', items: [] }
              : {};

    const res = await fetch('/api/page-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: JSON.stringify(defaultContent) }),
    });
    const newBlock = await res.json();
    if (newBlock.id) setBlocks((prev) => [...prev, newBlock].sort((a, b) => a.order - b.order));
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Видалити цей блок?')) return;
    await fetch(`/api/page-blocks?id=${id}`, { method: 'DELETE' });
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const nextBlocks = [...blocks];
    const currentOrder = nextBlocks[index].order;
    nextBlocks[index].order = nextBlocks[targetIndex].order;
    nextBlocks[targetIndex].order = currentOrder;
    setBlocks(nextBlocks.sort((a, b) => a.order - b.order));
  };

  const updateBlock = (index: number, patch: Partial<PageBlock>) => {
    setBlocks((prev) => prev.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)));
  };

  const updateBlockContent = (index: number, newContent: Record<string, unknown>) => {
    updateBlock(index, { content: JSON.stringify(newContent) });
  };

  const handleBlockUpload = async (index: number, updater: (parsed: any, url: string) => void, file: File) => {
    const key = `block-${blocks[index].id}`;
    setUploadingState((prev) => ({ ...prev, [key]: true }));
    try {
      const url = await uploadFile(file, 'block_media');
      const parsed = parseBlockContent(blocks[index].content);
      updater(parsed, url);
      updateBlockContent(index, parsed);
    } catch {
      setNotice('Не вдалося завантажити медіа для блоку.');
    } finally {
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setNotice('');
    try {
      const [contentRes, blockRes] = await Promise.all([
        fetch('/api/cms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        }),
        fetch('/api/page-blocks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blocks),
        }),
      ]);

      setNotice(contentRes.ok && blockRes.ok ? 'Зміни збережено.' : 'Не все вдалося зберегти.');
    } catch {
      setNotice('Помилка збереження.');
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (fields: FieldConfig[], columns = true) => (
    <div className={columns ? 'grid gap-5 lg:grid-cols-2' : 'space-y-5'}>
      {fields.map((field) => (
        <CmsField
          key={field.key}
          field={field}
          value={content[field.key] || ''}
          uploading={uploadingState[field.key]}
          onChange={(value) => updateContent(field.key, value)}
          onUpload={(file) => handleGlobalUpload(field.key, file)}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-[#e9c349]">
        <Loader2 className="mr-3 animate-spin" /> Завантаження редактора...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e4e2e3]">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Редактор сайту</h1>
              <p className="m-0 mt-1 text-sm text-[#8a8a93]">Тексти, секції, медіа, metadata і структура головної без сирого хаосу.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {notice && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#c7c6ca]">
              <CheckCircle2 size={16} className="text-[#e9c349]" />
              {notice}
            </div>
          )}
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Збереження' : 'Зберегти все'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-white/10 bg-[#13131a] p-3">
          <div className="mb-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6f78]">Розділи редактора</div>
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-[#e9c349]/40 bg-[#e9c349]/12 text-white'
                      : 'border-transparent text-[#c7c6ca] hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? 'bg-[#e9c349] text-black' : 'bg-white/5 text-[#e9c349]'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{tab.label}</div>
                    <div className="truncate text-xs text-[#8a8a93]">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-6">
          {activeTab === 'home' && (
            <>
              <SectionShell icon={Globe2} title="Навігація і бренд" desc="Назва, логотип, меню, кнопки і базова мова сайту.">
                {renderFields(homeFields.slice(0, 12))}
              </SectionShell>
              <SectionShell icon={Sparkles} title="Hero і головні заголовки" desc="Тут працює логіка двоколірного тексту через *зірочки*, як у референсі, але в нашій темі.">
                {renderFields(homeFields.slice(12), false)}
              </SectionShell>
              <SectionShell icon={Sparkles} title="Переваги" desc="Іконки обираються з бібліотеки, назви і описи редагуються як окремі поля.">
                <div className="grid gap-4 xl:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-[#080818] p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">Перевага {index}</div>
                          <div className="text-xs text-[#8a8a93]">Іконка, заголовок, опис</div>
                        </div>
                        <DynamicIcon name={content[`feature_${index}_icon`]} size={24} className="text-[#e9c349]" />
                      </div>
                      <div className="space-y-4">
                        <IconPicker value={content[`feature_${index}_icon`]} onChange={(value) => updateContent(`feature_${index}_icon`, value)} />
                        <CmsField field={{ key: `feature_${index}_title`, label: 'Заголовок', preview: true }} value={content[`feature_${index}_title`]} onChange={(value) => updateContent(`feature_${index}_title`, value)} onUpload={() => undefined} />
                        <CmsField field={{ key: `feature_${index}_desc`, label: 'Опис', type: 'textarea' }} value={content[`feature_${index}_desc`]} onChange={(value) => updateContent(`feature_${index}_desc`, value)} onUpload={() => undefined} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionShell>
            </>
          )}

          {activeTab === 'blocks' && (
            <>
              <SectionShell icon={Plus} title="Додати секцію" desc="Блоки нижче йдуть у тому порядку, у якому вони показуються на головній.">
                <div className="grid gap-3 md:grid-cols-4">
                  {Object.entries(blockLabels).map(([type, label]) => (
                    <button key={type} onClick={() => addBlock(type)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white transition-colors hover:border-[#e9c349]/40 hover:bg-[#e9c349]/10">
                      + {label}
                    </button>
                  ))}
                </div>
              </SectionShell>

              {blocks.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 bg-[#13131a] p-8 text-center text-[#8a8a93]">
                  Немає жодного блоку. Додай перший блок вище.
                </div>
              )}

              {blocks.map((block, index) => {
                const parsed = parseBlockContent(block.content);
                const uploadKey = `block-${block.id}`;

                return (
                  <section key={block.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#13131a]">
                    <div className="flex flex-col gap-3 border-b border-white/10 bg-[#171721] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#080818] text-[#e9c349]">{index + 1}</div>
                        <div>
                          <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#e9c349]">{blockLabels[block.type] || block.type}</div>
                          <div className="text-xs text-[#8a8a93]">PageBlock: {block.type}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="rounded-lg bg-white/5 p-2 text-white hover:bg-white/10 disabled:opacity-30"><ArrowUp size={16} /></button>
                        <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="rounded-lg bg-white/5 p-2 text-white hover:bg-white/10 disabled:opacity-30"><ArrowDown size={16} /></button>
                        <button
                          onClick={() => updateBlock(index, { active: !block.active })}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${block.active ? 'border-[#e9c349]/40 text-[#e9c349]' : 'border-white/10 text-[#8a8a93]'}`}
                        >
                          <Eye size={16} />
                          {block.active ? 'Активний' : 'Прихований'}
                        </button>
                        <button onClick={() => deleteBlock(block.id)} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      {block.type === 'HERO' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок', type: 'textarea', preview: true, hint: 'Золотий акцент через *зірочки*.' }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <CmsField field={{ key: 'subtitle', label: 'Підзаголовок', type: 'textarea' }} value={parsed.subtitle || ''} onChange={(value) => updateBlockContent(index, { ...parsed, subtitle: value })} onUpload={() => undefined} />
                          <CmsField field={{ key: 'bgImage', label: 'Фон hero', type: 'media' }} value={parsed.bgImage || ''} uploading={uploadingState[uploadKey]} onChange={(value) => updateBlockContent(index, { ...parsed, bgImage: value })} onUpload={(file) => handleBlockUpload(index, (data, url) => { data.bgImage = url; }, file)} />
                        </>
                      )}

                      {block.type === 'INFO' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок секції', preview: true, hint: 'Золотий акцент через *зірочки*. Можна лишити порожнім.' }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <CmsField field={{ key: 'subtitle', label: 'Підзаголовок секції', type: 'textarea' }} value={parsed.subtitle || ''} onChange={(value) => updateBlockContent(index, { ...parsed, subtitle: value })} onUpload={() => undefined} />

                          <div className="space-y-4">
                            {(parsed.items || []).map((item: any, itemIndex: number) => (
                              <div key={itemIndex} className="rounded-xl border border-white/10 bg-[#080818] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-sm font-bold text-[#e9c349]">Пункт {itemIndex + 1} {itemIndex % 2 === 1 ? '(фото справа)' : '(фото зліва)'}</span>
                                  <button onClick={() => {
                                    const items = [...(parsed.items || [])];
                                    items.splice(itemIndex, 1);
                                    updateBlockContent(index, { ...parsed, items });
                                  }} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
                                </div>
                                <input
                                  value={item.title || ''}
                                  onChange={(event) => {
                                    const items = [...(parsed.items || [])];
                                    items[itemIndex] = { ...items[itemIndex], title: event.target.value };
                                    updateBlockContent(index, { ...parsed, items });
                                  }}
                                  placeholder="Заголовок пункту (необов'язково)"
                                  className={`${fieldClass()} mb-3`}
                                />
                                <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-white text-black">
                                  <RichEditor
                                    value={item.text || ''}
                                    onChange={(value) => {
                                      const items = [...(parsed.items || [])];
                                      items[itemIndex] = { ...items[itemIndex], text: value };
                                      updateBlockContent(index, { ...parsed, items });
                                    }}
                                  />
                                </div>
                                <CmsField
                                  field={{ key: `info-img-${itemIndex}`, label: 'Фото / відео пункту', type: 'media' }}
                                  value={item.image || ''}
                                  uploading={uploadingState[uploadKey]}
                                  onChange={(value) => {
                                    const items = [...(parsed.items || [])];
                                    items[itemIndex] = { ...items[itemIndex], image: value };
                                    updateBlockContent(index, { ...parsed, items });
                                  }}
                                  onUpload={(file) => handleBlockUpload(index, (data, url) => {
                                    if (!data.items) data.items = [];
                                    data.items[itemIndex] = { ...data.items[itemIndex], image: url };
                                  }, file)}
                                />
                              </div>
                            ))}
                            <button onClick={() => updateBlockContent(index, { ...parsed, items: [...(parsed.items || []), { title: '', text: '', image: '' }] })} className="rounded-lg border border-[#e9c349]/30 px-4 py-2 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/10">
                              + Додати пункт
                            </button>
                          </div>
                        </>
                      )}

                      {block.type === 'TEXT_IMAGE' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок', preview: true }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">Текст блоку</label>
                            <div className="overflow-hidden rounded-lg border border-white/10 bg-white text-black">
                              <RichEditor value={parsed.text || ''} onChange={(value) => updateBlockContent(index, { ...parsed, text: value })} />
                            </div>
                          </div>
                          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                            <CmsField field={{ key: 'image', label: 'Зображення', type: 'media' }} value={parsed.image || ''} uploading={uploadingState[uploadKey]} onChange={(value) => updateBlockContent(index, { ...parsed, image: value })} onUpload={(file) => handleBlockUpload(index, (data, url) => { data.image = url; }, file)} />
                            <div className="space-y-2">
                              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">Позиція медіа</label>
                              <select value={parsed.imagePosition || 'left'} onChange={(event) => updateBlockContent(index, { ...parsed, imagePosition: event.target.value })} className={fieldClass()}>
                                <option value="left">Зліва</option>
                                <option value="right">Справа</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {block.type === 'GALLERY' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок галереї', preview: true }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">Медіа блоку</div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                              {(parsed.items || []).map((url: string, mediaIndex: number) => (
                                <div key={`${url}-${mediaIndex}`} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
                                  {url.includes('.mp4') || url.includes('.webm') ? <video src={url} className="h-full w-full object-cover" muted /> : <img src={url} alt="" className="h-full w-full object-cover" />}
                                  <button
                                    onClick={() => {
                                      const items = [...(parsed.items || [])];
                                      items.splice(mediaIndex, 1);
                                      updateBlockContent(index, { ...parsed, items });
                                    }}
                                    className="absolute right-2 top-2 rounded bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 text-sm font-bold text-[#c7c6ca] hover:border-[#e9c349]/40 hover:text-[#e9c349]">
                                {uploadingState[uploadKey] ? <Loader2 className="animate-spin" /> : <GalleryHorizontalEnd />}
                                Додати
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(event) => event.target.files?.[0] && handleBlockUpload(index, (data, url) => {
                                    if (!data.items) data.items = [];
                                    data.items.push(url);
                                  }, event.target.files[0])}
                                />
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {block.type === 'FEATURES' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок блоку', preview: true }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <div className="space-y-3">
                            {(parsed.items || []).map((feature: any, featureIndex: number) => (
                              <div key={featureIndex} className="grid gap-3 rounded-lg border border-white/10 bg-[#080818] p-3 lg:grid-cols-[210px_1fr_2fr_auto] lg:items-center">
                                <IconPicker value={feature.icon || 'Star'} onChange={(value) => {
                                  const items = [...(parsed.items || [])];
                                  items[featureIndex] = { ...items[featureIndex], icon: value };
                                  updateBlockContent(index, { ...parsed, items });
                                }} />
                                <input value={feature.title || ''} onChange={(event) => {
                                  const items = [...(parsed.items || [])];
                                  items[featureIndex] = { ...items[featureIndex], title: event.target.value };
                                  updateBlockContent(index, { ...parsed, items });
                                }} placeholder="Назва" className={fieldClass()} />
                                <textarea rows={3} value={feature.desc || ''} onChange={(event) => {
                                  const items = [...(parsed.items || [])];
                                  items[featureIndex] = { ...items[featureIndex], desc: event.target.value };
                                  updateBlockContent(index, { ...parsed, items });
                                }} placeholder="Опис" className={`${fieldClass()} min-h-[88px] resize-y`} />
                                <button onClick={() => {
                                  const items = [...(parsed.items || [])];
                                  items.splice(featureIndex, 1);
                                  updateBlockContent(index, { ...parsed, items });
                                }} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => updateBlockContent(index, { ...parsed, items: [...(parsed.items || []), { icon: 'CircleCheck', title: '', desc: '' }] })} className="rounded-lg border border-[#e9c349]/30 px-4 py-2 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/10">
                              + Додати перевагу
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                );
              })}
            </>
          )}

          {activeTab === 'contacts' && (
            <SectionShell icon={Mail} title="Контакти, форма і footer" desc="Усе, що бачить клієнт у контактному блоці та в нижній частині сайту.">
              {renderFields(contactFields)}
            </SectionShell>
          )}

          {activeTab === 'seo' && (
            <SectionShell icon={Search} title="Metadata і structured data" desc="Ці поля впливають на metadata сторінки і JSON-LD schema.">
              {renderFields(seoFields)}
            </SectionShell>
          )}

          {activeTab === 'technical' && (
            <SectionShell icon={Settings2} title="Технічні ключі" desc="Сюди сховані всі ключі, які ще не мають окремої логічної секції. Це тимчасовий міст, не головний редактор.">
              <div className="mb-5 rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-4 text-sm text-[#e4e2e3]">
                Нові екрани треба переносити з цієї вкладки у нормальні секції. Тут лишаються розрахунки, інтеграції та legacy-поля до їх повного переїзду в окремі сторінки.
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {technicalKeys.map((key) => {
                  const defaultValue = SITE_CONTENT_DEFAULTS[key];
                  const isMedia = key.includes('image') || key.includes('video') || key.includes('logo');

                  return (
                    <CmsField
                      key={key}
                      field={{
                        key,
                        label: key,
                        type: isMedia ? 'media' : defaultValue && defaultValue.length > 120 ? 'textarea' : 'text',
                        hint: 'Legacy або новий технічний ключ без окремої секції. Якщо поле стало важливим для роботи, переносимо його у логічний розділ.',
                      }}
                      value={content[key] || ''}
                      uploading={uploadingState[key]}
                      onChange={(value) => updateContent(key, value)}
                      onUpload={(file) => handleGlobalUpload(key, file)}
                    />
                  );
                })}
              </div>
            </SectionShell>
          )}
        </main>
      </div>
    </div>
  );
}
