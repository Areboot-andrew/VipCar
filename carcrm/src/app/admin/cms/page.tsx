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
  ImageIcon,
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
};

const tabs = [
  { id: 'home', label: 'Головна', desc: 'Hero, меню, переваги', icon: LayoutTemplate },
  { id: 'blocks', label: 'Блоки', desc: 'Конструктор секцій', icon: Blocks },
  { id: 'contacts', label: 'Контакти', desc: 'Форма, footer, CTA', icon: Mail },
  { id: 'seo', label: 'Meta', desc: 'Пошук і schema', icon: Search },
  { id: 'admin', label: 'Адмінка', desc: 'Назви меню панелі', icon: Settings2 },
  { id: 'technical', label: 'Технічні', desc: 'Решта ключів', icon: Settings2 },
] as const;

const brandFields: FieldConfig[] = [
  { key: 'brand_name', label: 'Назва бренду', hint: 'Використовується у шапці, footer і службових підписах.' },
  { key: 'logo_url', label: 'Логотип', type: 'media', hint: 'Основний логотип сайту. Краще PNG/WebP з прозорим або темним фоном.' },
  { key: 'menu_home', label: 'Меню: головна', hint: 'Текст пункту «Головна» у мобільному меню.' },
  { key: 'menu_services', label: 'Меню: послуги', hint: 'Текст пункту навігації у шапці.' },
  { key: 'menu_fleet', label: 'Меню: автопарк', hint: 'Текст пункту, який веде до автомобілів.' },
  { key: 'menu_gallery', label: 'Меню: галерея', hint: 'Текст пункту, який веде до галереї автопарку.' },
  { key: 'menu_contact', label: 'Меню: контакти', hint: 'Текст пункту контактного блоку.' },
  { key: 'menu_calculator', label: 'Меню: бронювання', hint: 'Текст пункту, який веде до калькулятора (footer/мобільне меню).' },
  { key: 'menu_login', label: 'Меню: вхід', hint: 'Показується неавторизованому користувачу.' },
  { key: 'menu_profile', label: 'Меню: профіль', hint: 'Показується авторизованому клієнту.' },
  { key: 'menu_driver_cabinet', label: 'Меню: кабінет водія', hint: 'Показується користувачу з роллю водія.' },
  { key: 'menu_logout', label: 'Меню: вихід', hint: 'Текст кнопки виходу з акаунта.' },
  { key: 'btn_book_now', label: 'Кнопка в шапці', hint: 'Головна кнопка швидкого переходу до бронювання.' },
  { key: 'btn_hero_cta', label: 'Головна CTA-кнопка', hint: 'Кнопка в першому екрані головної сторінки.' },
  { key: 'loading_calculator', label: 'Текст завантаження калькулятора', hint: 'Показується, поки форма бронювання підтягує дані.' },
];

const heroFields: FieldConfig[] = [
  { key: 'hero_title', label: 'Hero заголовок', type: 'textarea', preview: true, hint: 'Золотий акцент: *текст*. Новий рядок теж підтримується.' },
  { key: 'hero_subtitle', label: 'Hero підзаголовок', type: 'textarea', hint: 'Можна виділяти слова через *зірочки*.' },
  { key: 'hero_bg_image', label: 'Hero фон', type: 'media', hint: 'Фонове зображення першого екрана, якщо відео не задане або не завантажилось.' },
  { key: 'hero_bg_video', label: 'Hero відео', type: 'media', hint: 'Відеофон першого екрана. Має бути коротким і оптимізованим.' },
  { key: 'services_title', label: 'Заголовок переваг', preview: true, hint: 'Наприклад: Чому обирають *нас*?' },
  { key: 'gallery_title', label: 'Заголовок галереї', preview: true, hint: 'Заголовок блоку галереї на головній сторінці.' },
  { key: 'gallery_subtitle', label: 'Опис галереї', type: 'textarea', hint: 'Короткий клієнтський опис автопарку, без технічних приміток.' },
];

// Admin panel naming: sidebar brand, group titles and menu items
const adminNavItems: { id: string; label: string }[] = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'bookings', label: 'Заявки і календар' },
  { id: 'chat', label: 'Повідомлення' },
  { id: 'fleet', label: 'Авто і медіа' },
  { id: 'promotions', label: 'Empty Legs' },
  { id: 'users', label: 'Клієнти, водії, ролі' },
  { id: 'feedback', label: "Зворотний зв'язок" },
  { id: 'cms', label: 'Редактор сайту' },
  { id: 'marketing', label: 'Соцмережі і пости' },
  { id: 'invoices', label: 'Рахунки' },
  { id: 'settings', label: 'Налаштування CRM' },
];

const adminGroupKeys: { key: string; label: string }[] = [
  { key: 'admin_group_operations', label: 'Група: Операції' },
  { key: 'admin_group_fleet', label: 'Група: Автопарк' },
  { key: 'admin_group_clients', label: 'Група: Клієнти' },
  { key: 'admin_group_marketing', label: 'Група: Маркетинг' },
  { key: 'admin_group_content', label: 'Група: Контент' },
  { key: 'admin_group_finance', label: 'Група: Фінанси' },
  { key: 'admin_group_system', label: 'Група: Система' },
];

const adminKeys = [
  'admin_brand_title',
  'admin_brand_subtitle',
  'admin_open_site',
  ...adminGroupKeys.map((item) => item.key),
  ...adminNavItems.flatMap((item) => [`admin_nav_${item.id}`, `admin_nav_${item.id}_desc`]),
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
  { key: 'gallery_fallback_alt', label: 'Alt фото галереї', hint: 'Запасний alt-текст для фото без власного опису (важливо для SEO і доступності).' },
  { key: 'google_analytics_id', label: 'Google Analytics ID', hint: 'Вимірювальний ID (G-XXXXXXX або UA-...). Порожньо — аналітика вимкнена. sitemap.xml і robots.txt працюють автоматично.' },
];

const explicitKeys = new Set([
  ...brandFields.map((field) => field.key),
  ...heroFields.map((field) => field.key),
  ...contactFields.map((field) => field.key),
  ...seoFields.map((field) => field.key),
  ...adminKeys,
  'standalone_gallery_media',
  ...Array.from({ length: 4 }).flatMap((_, index) => [
    `feature_${index + 1}_icon`,
    `feature_${index + 1}_title`,
    `feature_${index + 1}_desc`,
  ]),
]);

// Keys that have their own proper screens — hidden from the CMS "technical" dump.
// Integrations/pricing live in Налаштування, campaigns in Маркетинг.
const managedPrefixes = [
  'telegram_', 'facebook_', 'whatsapp_', 'google_', 'marketing_', 'payment_', 'pricing_',
];
const managedKeys = new Set([
  'deposit_percent', 'weekend_coefficient', 'amortization_rate', 'margin_rate', 'delivery_rate',
  'fuel_price_uah', 'eur_to_uah_rate', 'child_seat_fee', 'animal_fee', 'meet_and_greet_fee',
  'luggage_medium_fee', 'luggage_large_fee', 'base_location_lat', 'base_location_lng',
  'messenger_last_event_at', '_demo_seed_version',
]);
const isManagedElsewhere = (key: string) =>
  managedKeys.has(key) || managedPrefixes.some((prefix) => key.startsWith(prefix));

const blockLabels: Record<string, string> = {
  HERO: 'Hero банер',
  TEXT_IMAGE: 'Текст + медіа',
  GALLERY: 'Галерея',
  FEATURES: 'Переваги',
  CTA: 'Заклик до дії',
};

const blockHints: Record<string, string> = {
  HERO: 'Великий перший екран: заголовок, підзаголовок, фон (фото або відео).',
  TEXT_IMAGE: 'Текстова секція з форматуванням і зображенням зліва або справа.',
  GALLERY: 'Стрічка фото/відео. Якщо медіа не додані — підтягнуться авто з автопарку.',
  FEATURES: 'Сітка переваг з іконками (пунктів може бути скільки завгодно).',
  CTA: 'Помітний банер із кнопкою: веде на калькулятор, галерею або будь-який лінк.',
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
  uploading,
  onChange,
  onUpload,
}: {
  field: FieldConfig;
  value: string;
  uploading?: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
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
      ) : (
        <div className={isMedia ? 'grid gap-3 md:grid-cols-[96px_1fr_auto]' : ''}>
          {isMedia && (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
              {value ? (
                value.includes('.mp4') || value.includes('.webm') ? (
                  <video src={value} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={value} alt={field.label} className="h-full w-full object-cover" />
                )
              ) : (
                <ImageIcon className="text-[#64646d]" />
              )}
            </div>
          )}
          <input
            id={inputId}
            type={field.type === 'secret' ? 'password' : 'text'}
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            className={fieldClass()}
          />
          {isMedia && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:border-[#e9c349]/40 hover:bg-[#e9c349]/10">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Завантаження' : 'Файл'}
              <input type="file" className="hidden" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
            </label>
          )}
        </div>
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
      .filter((key) => !explicitKeys.has(key) && !isManagedElsewhere(key))
      .sort((a, b) => a.localeCompare(b));
  }, [content]);

  // When active blocks exist, the homepage is built from the constructor —
  // hero/features/gallery fields are hidden on the "Головна" tab to avoid duplicates.
  const hasActiveBlocks = useMemo(() => blocks.some((block) => block.active), [blocks]);

  // Standalone gallery media (extra photos/videos beside the fleet ones)
  const standaloneMedia = useMemo(() => {
    try {
      const parsed = JSON.parse(content.standalone_gallery_media || '[]');
      return Array.isArray(parsed) ? (parsed as { type: string; url: string }[]) : [];
    } catch {
      return [];
    }
  }, [content.standalone_gallery_media]);

  const addStandaloneMedia = async (file: File) => {
    setUploadingState((prev) => ({ ...prev, standalone_gallery_media: true }));
    try {
      const url = await uploadFile(file, 'gallery_media');
      const items = [...standaloneMedia, { type: url.includes('.mp4') || url.includes('.webm') ? 'video' : 'image', url }];
      updateContent('standalone_gallery_media', JSON.stringify(items));
    } catch {
      setNotice('Не вдалося завантажити медіа.');
    } finally {
      setUploadingState((prev) => ({ ...prev, standalone_gallery_media: false }));
    }
  };

  const removeStandaloneMedia = (removeIndex: number) => {
    const items = standaloneMedia.filter((_, itemIndex) => itemIndex !== removeIndex);
    updateContent('standalone_gallery_media', JSON.stringify(items));
  };

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
        : type === 'GALLERY'
          ? { title: 'Галерея', items: [] }
          : type === 'TEXT_IMAGE'
            ? { title: 'Заголовок', text: 'Текст', image: '', imagePosition: 'left' }
            : type === 'FEATURES'
              ? { title: 'Переваги', items: [] }
              : type === 'CTA'
                ? { title: 'Готові *їхати*?', subtitle: 'Розрахуйте вартість поїздки за хвилину.', buttonText: 'Розрахувати поїздку', buttonLink: '#calculator', bgImage: '' }
                : {};

    const res = await fetch('/api/page-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: JSON.stringify(defaultContent) }),
    });
    const newBlock = await res.json();
    if (newBlock.id) setBlocks((prev) => [...prev, newBlock].sort((a, b) => a.order - b.order));
  };

  // One-time conversion: builds blocks from the CURRENT site content (no retyping),
  // after which hero/features/gallery are edited only in the constructor.
  const convertLayoutToBlocks = async () => {
    if (!confirm('Зібрати блоки з поточного наповнення головної? Після цього Hero, переваги і галерея редагуються тільки в конструкторі — без дублів.')) return;

    const featureItems = [1, 2, 3, 4]
      .map((i) => ({
        icon: content[`feature_${i}_icon`] || 'Star',
        title: content[`feature_${i}_title`] || '',
        desc: content[`feature_${i}_desc`] || '',
      }))
      .filter((item) => item.title);

    const payloads = [
      {
        type: 'HERO',
        content: JSON.stringify({
          title: content.hero_title || '',
          subtitle: content.hero_subtitle || '',
          bgImage: content.hero_bg_video || content.hero_bg_image || '',
        }),
      },
      {
        type: 'FEATURES',
        content: JSON.stringify({ title: content.services_title || 'Переваги', items: featureItems }),
      },
      {
        type: 'GALLERY',
        content: JSON.stringify({ title: content.gallery_title || '', subtitle: content.gallery_subtitle || '', items: [] }),
      },
    ];

    const created: PageBlock[] = [];
    for (const payload of payloads) {
      const res = await fetch('/api/page-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const block = await res.json();
      if (block.id) created.push(block);
    }
    setBlocks((prev) => [...prev, ...created].sort((a, b) => a.order - b.order));
    setNotice('Блоки зібрано з твого контенту. Головна тепер редагується конструктором.');
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
              <SectionShell icon={Globe2} title="Навігація і бренд" desc="Назва, логотип, меню, кнопки. Працює завжди, незалежно від блоків.">
                {renderFields(brandFields)}
              </SectionShell>
              {hasActiveBlocks ? (
                <SectionShell icon={Blocks} title="Hero, переваги і галерея" desc="Головна зараз будується з блоків конструктора.">
                  <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-5">
                    <p className="m-0 text-sm leading-6 text-[#e4e2e3]">
                      Ці секції редагуються у вкладці <strong>«Блоки»</strong> — поля тут сховані, щоб не було двох місць редагування одного контенту.
                      Якщо вимкнути або видалити всі блоки, сайт повернеться до стандартного макета, і поля з'являться знову.
                    </p>
                    <button onClick={() => setActiveTab('blocks')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e9c349] px-4 py-2.5 text-sm font-bold text-black">
                      <Blocks size={16} /> Відкрити конструктор блоків
                    </button>
                  </div>
                </SectionShell>
              ) : (
                <>
                  <SectionShell icon={Sparkles} title="Hero і головні заголовки" desc="Тут працює логіка двоколірного тексту через *зірочки*, як у референсі, але в нашій темі.">
                    {renderFields(heroFields, false)}
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

              <SectionShell icon={GalleryHorizontalEnd} title="Додаткові медіа галереї" desc="Фото/відео, які показуються в галереї на додачу до медіа автомобілів з автопарку.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {standaloneMedia.map((item, mediaIndex) => (
                    <div key={`${item.url}-${mediaIndex}`} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
                      {item.type === 'video' ? (
                        <video src={item.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      )}
                      <button
                        onClick={() => removeStandaloneMedia(mediaIndex)}
                        className="absolute right-2 top-2 rounded bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 text-sm font-bold text-[#c7c6ca] hover:border-[#e9c349]/40 hover:text-[#e9c349]">
                    {uploadingState['standalone_gallery_media'] ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                    Додати
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={(event) => event.target.files?.[0] && addStandaloneMedia(event.target.files[0])} />
                  </label>
                </div>
                <p className="m-0 mt-3 text-xs leading-5 text-[#6f6f78]">Основні фото авто керуються в «Авто і медіа». Тут — додаткові кадри: офіс, водії, атмосферні фото.</p>
              </SectionShell>
            </>
          )}

          {activeTab === 'blocks' && (
            <>
              {blocks.length === 0 && (
                <SectionShell icon={Sparkles} title="Перенести мій контент у блоки" desc="Разова конвертація без передруковування і без дублів.">
                  <p className="m-0 mb-4 text-sm leading-6 text-[#c7c6ca]">
                    Збере Hero (твій заголовок, підзаголовок і фон), Переваги (твої 4 картки з іконками) та Галерею з поточного наповнення бази.
                    Після цього ці секції редагуються тільки тут, а їхні поля на вкладці «Головна» ховаються.
                  </p>
                  <button onClick={convertLayoutToBlocks} className="inline-flex items-center gap-2 rounded-lg bg-[#e9c349] px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02]">
                    <Sparkles size={16} /> Зібрати блоки з мого контенту
                  </button>
                  <p className="m-0 mt-3 text-xs leading-5 text-[#6f6f78]">
                    Безпечно: стандартний макет лишається запасним — якщо видалити всі блоки, сайт повернеться до нього.
                  </p>
                </SectionShell>
              )}

              <SectionShell icon={Plus} title="Додати секцію" desc="Блоки нижче йдуть у тому порядку, у якому вони показуються на головній.">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(blockLabels).map(([type, label]) => (
                    <button key={type} onClick={() => addBlock(type)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-[#e9c349]/40 hover:bg-[#e9c349]/10">
                      <div className="text-sm font-bold text-white">+ {label}</div>
                      <div className="mt-1 text-xs leading-4 text-[#8a8a93]">{blockHints[type]}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[#8a8a93]">
                  Коли є хоча б один активний блок — головна сторінка будується з цих блоків (плюс Empty Legs, калькулятор і контакти, які завжди внизу). Якщо блоків немає — показується стандартний макет із вкладки «Головна».
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
                          <div className="text-xs text-[#8a8a93]">{blockHints[block.type] || block.type}</div>
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
                          <CmsField field={{ key: 'subtitle', label: 'Опис галереї', type: 'textarea' }} value={parsed.subtitle || ''} onChange={(value) => updateBlockContent(index, { ...parsed, subtitle: value })} onUpload={() => undefined} />
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">Медіа блоку — якщо порожньо, підтягнуться фото авто з автопарку</div>
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

                      {block.type === 'CTA' && (
                        <>
                          <CmsField field={{ key: 'title', label: 'Заголовок', preview: true, hint: 'Золотий акцент через *зірочки*.' }} value={parsed.title || ''} onChange={(value) => updateBlockContent(index, { ...parsed, title: value })} onUpload={() => undefined} />
                          <CmsField field={{ key: 'subtitle', label: 'Підзаголовок', type: 'textarea' }} value={parsed.subtitle || ''} onChange={(value) => updateBlockContent(index, { ...parsed, subtitle: value })} onUpload={() => undefined} />
                          <div className="grid gap-5 lg:grid-cols-2">
                            <CmsField field={{ key: 'buttonText', label: 'Текст кнопки' }} value={parsed.buttonText || ''} onChange={(value) => updateBlockContent(index, { ...parsed, buttonText: value })} onUpload={() => undefined} />
                            <CmsField field={{ key: 'buttonLink', label: 'Посилання кнопки', hint: '#calculator — калькулятор, /gallery — галерея, або повний URL.' }} value={parsed.buttonLink || ''} onChange={(value) => updateBlockContent(index, { ...parsed, buttonLink: value })} onUpload={() => undefined} />
                          </div>
                          <CmsField field={{ key: 'bgImage', label: 'Фонове зображення (опційно)', type: 'media' }} value={parsed.bgImage || ''} uploading={uploadingState[uploadKey]} onChange={(value) => updateBlockContent(index, { ...parsed, bgImage: value })} onUpload={(file) => handleBlockUpload(index, (data, url) => { data.bgImage = url; }, file)} />
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

          {activeTab === 'admin' && (
            <>
              <SectionShell icon={Settings2} title="Бренд панелі" desc="Заголовок і підпис у лівому верхньому куті адмінки.">
                <div className="grid gap-5 lg:grid-cols-3">
                  <CmsField field={{ key: 'admin_brand_title', label: 'Назва панелі' }} value={content['admin_brand_title'] || ''} onChange={(value) => updateContent('admin_brand_title', value)} onUpload={() => undefined} />
                  <CmsField field={{ key: 'admin_brand_subtitle', label: 'Підпис під назвою' }} value={content['admin_brand_subtitle'] || ''} onChange={(value) => updateContent('admin_brand_subtitle', value)} onUpload={() => undefined} />
                  <CmsField field={{ key: 'admin_open_site', label: 'Кнопка «Відкрити сайт»' }} value={content['admin_open_site'] || ''} onChange={(value) => updateContent('admin_open_site', value)} onUpload={() => undefined} />
                </div>
              </SectionShell>

              <SectionShell icon={Settings2} title="Групи меню" desc="Назви розділів у лівому меню адмінки.">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {adminGroupKeys.map((group) => (
                    <CmsField key={group.key} field={{ key: group.key, label: group.label }} value={content[group.key] || ''} onChange={(value) => updateContent(group.key, value)} onUpload={() => undefined} />
                  ))}
                </div>
              </SectionShell>

              <SectionShell icon={Settings2} title="Пункти меню" desc="Назва і короткий опис кожного пункту лівого меню.">
                <div className="grid gap-3">
                  {adminNavItems.map((item) => (
                    <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-[#080818] p-3 lg:grid-cols-[180px_1fr_1.4fr] lg:items-center">
                      <div className="text-sm font-bold text-[#e9c349]">{item.label}</div>
                      <input
                        value={content[`admin_nav_${item.id}`] || ''}
                        onChange={(event) => updateContent(`admin_nav_${item.id}`, event.target.value)}
                        placeholder="Назва пункту"
                        className={fieldClass()}
                      />
                      <input
                        value={content[`admin_nav_${item.id}_desc`] || ''}
                        onChange={(event) => updateContent(`admin_nav_${item.id}_desc`, event.target.value)}
                        placeholder="Короткий опис під назвою"
                        className={fieldClass()}
                      />
                    </div>
                  ))}
                </div>
              </SectionShell>
            </>
          )}

          {activeTab === 'technical' && (
            <SectionShell icon={Settings2} title="Технічні ключі" desc="Контентні ключі без окремої секції. Тільки тексти і медіа — жодних токенів чи тарифів.">
              <div className="mb-5 rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-4 text-sm leading-6 text-[#e4e2e3]">
                Інтеграції (Telegram, Meta, WhatsApp), тарифи, завдаток і реквізити редагуються в <a href="/admin/settings" className="font-bold text-[#e9c349] underline underline-offset-2">Налаштуваннях CRM</a>, пости і кампанії — у <a href="/admin/marketing" className="font-bold text-[#e9c349] underline underline-offset-2">Маркетингу</a>. Тут вони не показуються, щоб випадково нічого не зламати.
              </div>
              {technicalKeys.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 bg-[#080818] p-8 text-center text-sm text-[#8a8a93]">
                  Все розкладено по секціях — нерозібраних ключів немає. Нові невідомі ключі з бази з'являться тут автоматично.
                </div>
              )}
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
