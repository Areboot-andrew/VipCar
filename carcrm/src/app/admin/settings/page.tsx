'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  BadgeEuro,
  Building2,
  CreditCard,
  ExternalLink,
  Fuel,
  Globe,
  KeyRound,
  MessageSquare,
  PlugZap,
  Plus,
  Save,
  Send,
  Settings,
  Trash2,
} from 'lucide-react';

type CurrencyRate = {
  id: string;
  currency: string;
  rateToEur: number;
};

type FuelPrice = {
  id: string;
  country: string;
  fuelType: string;
  priceEur: number;
};

type SettingsPayload = {
  currencies: CurrencyRate[];
  fuelPrices: FuelPrice[];
  contentSettings: Record<string, string>;
};

type TabId = 'business' | 'pricing' | 'messengers' | 'auth' | 'payments';

const tabs: { id: TabId; label: string; icon: ElementType }[] = [
  { id: 'business', label: 'Бізнес', icon: Building2 },
  { id: 'pricing', label: 'Ціни і валюти', icon: BadgeEuro },
  { id: 'messengers', label: 'Месенджери', icon: MessageSquare },
  { id: 'auth', label: 'Авторизація', icon: KeyRound },
  { id: 'payments', label: 'Оплата', icon: CreditCard },
];

const defaultContentSettings: Record<string, string> = {
  brand_name: '',
  contact_phone: '',
  contact_email: '',
  payment_card: '',
  payment_usdt: '',
  telegram_enabled: 'false',
  telegram_bot_token: '',
  telegram_admin_chat_id: '',
  telegram_api_id: '',
  telegram_api_hash: '',
  telegram_string_session: '',
  facebook_enabled: 'false',
  facebook_page_token: '',
  facebook_verify_token: '',
  whatsapp_enabled: 'false',
  whatsapp_phone_number_id: '',
  whatsapp_business_account_id: '',
  whatsapp_access_token: '',
  whatsapp_verify_token: '',
  google_auth_enabled: 'false',
  google_client_id: '',
  google_client_secret: '',
  facebook_auth_enabled: 'false',
  facebook_client_id: '',
  facebook_client_secret: '',
  pricing_delivery_rate: '1.1',
  pricing_delivery_base_fee: '20',
  pricing_customs_wait_hours: '1.5',
  pricing_manual_waiting_hours: '0',
  pricing_prep_buffer_mins: '30',
  pricing_traffic_buffer_percent: '10',
  pricing_time_rate_per_hour: '0',
  pricing_hotel_after_hours: '10',
  pricing_hotel_cost_per_night: '90',
  pricing_min_margin_percent: '0.25',
  weekend_coefficient: '1.2',
  deposit_percent: '30',
};

const fuelTypes = ['Бензин', 'Дизель', 'Газ', 'Електро'];

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  secret = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  secret?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#8a8a93]">{label}</span>
      <input
        type={secret ? 'password' : type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#56565f] focus:border-[#e9c349]/60"
      />
      {hint && <span className="text-xs leading-5 text-[#6f6f78]">{hint}</span>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {hint && <span className="mt-1 block text-xs leading-5 text-[#6f6f78]">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#e9c349]"
      />
    </label>
  );
}

function HelpLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-bold text-[#e9c349] hover:text-[#ffe175]"
    >
      {children}
      <ExternalLink size={13} />
    </a>
  );
}

function CopyBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8a8a93]">{label}</div>
      <code className="block break-all rounded-md bg-[#080818] px-3 py-2 text-xs text-[#e9c349]">{value}</code>
      {hint && <div className="mt-2 text-xs leading-5 text-[#6f6f78]">{hint}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [contentSettings, setContentSettings] = useState(defaultContentSettings);
  const [publicOrigin, setPublicOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [telegramNotice, setTelegramNotice] = useState('');
  const [telegramAuth, setTelegramAuth] = useState({ phoneNumber: '', phoneCodeHash: '', code: '', password: '' });
  const [newCurrency, setNewCurrency] = useState({ currency: 'UAH', rateToEur: 42.5 });
  const [newFuel, setNewFuel] = useState({ country: 'Україна', fuelType: 'Дизель', priceEur: 1.1 });

  const sortedFuelPrices = useMemo(
    () => [...fuelPrices].sort((a, b) => a.country.localeCompare(b.country, 'uk') || a.fuelType.localeCompare(b.fuelType, 'uk')),
    [fuelPrices]
  );

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = (await res.json()) as SettingsPayload;
      setCurrencies(data.currencies || []);
      setFuelPrices(data.fuelPrices || []);
      setContentSettings({ ...defaultContentSettings, ...(data.contentSettings || {}) });
    } catch (err) {
      console.error(err);
      setNotice('Не вдалося завантажити налаштування.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPublicOrigin(window.location.origin);
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setContentSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Live-status per messenger: timestamp of the last incoming event (set by webhooks/listener)
  const lastEvent = (key: string) => {
    const raw = (contentSettings as Record<string, string>)[key];
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString('uk-UA');
  };

  const StatusLine = ({ settingKey }: { settingKey: string }) => {
    const value = lastEvent(settingKey);
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${value ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-black/20 text-[#6f6f78]'}`}>
        <span className={`h-2 w-2 rounded-full ${value ? 'bg-emerald-400' : 'bg-[#56565f]'}`}></span>
        {value ? `Останнє вхідне: ${value}` : 'Вхідних повідомлень ще не було'}
      </div>
    );
  };

  const saveContentSettings = async () => {
    setSaving(true);
    setNotice('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contentSettings', settings: contentSettings }),
      });
      setNotice(res.ok ? 'Налаштування збережено.' : 'Не вдалося зберегти налаштування.');
      return res.ok;
    } catch (err) {
      console.error(err);
      setNotice('Не вдалося зберегти налаштування.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendTelegramCode = async () => {
    setTelegramNotice('');
    if (!contentSettings.telegram_api_id || !contentSettings.telegram_api_hash) {
      setTelegramNotice('Спочатку заповни Telegram API ID і API Hash.');
      return;
    }
    if (!telegramAuth.phoneNumber) {
      setTelegramNotice('Вкажи номер телефону Telegram у міжнародному форматі.');
      return;
    }

    const saved = await saveContentSettings();
    if (!saved) return;

    const res = await fetch('/api/telegram/auth/sendCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: telegramAuth.phoneNumber }),
    });
    const data = await res.json();
    if (res.ok && data.phoneCodeHash) {
      setTelegramAuth((prev) => ({ ...prev, phoneCodeHash: data.phoneCodeHash }));
      setTelegramNotice('Код відправлено в Telegram. Введи його нижче і підтвердь сесію.');
    } else {
      setTelegramNotice(data.error || 'Не вдалося відправити код Telegram.');
    }
  };

  const verifyTelegramCode = async () => {
    setTelegramNotice('');
    if (!telegramAuth.phoneNumber || !telegramAuth.phoneCodeHash || !telegramAuth.code) {
      setTelegramNotice('Потрібні номер, отриманий код і phoneCodeHash.');
      return;
    }

    const res = await fetch('/api/telegram/auth/verifyCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramAuth),
    });
    const data = await res.json();
    if (res.ok) {
      updateSetting('telegram_enabled', 'true');
      setTelegramNotice('Telegram підключено. Сесію збережено в базу.');
      await fetchSettings();
    } else {
      setTelegramNotice(data.error || 'Не вдалося підтвердити Telegram.');
    }
  };

  const handleAddCurrency = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'currency', ...newCurrency }),
    });
    fetchSettings();
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Видалити курс?')) return;
    await fetch(`/api/settings?type=currency&id=${id}`, { method: 'DELETE' });
    fetchSettings();
  };

  const handleAddFuel = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fuel', ...newFuel }),
    });
    fetchSettings();
  };

  const handleDeleteFuel = async (id: string) => {
    if (!confirm('Видалити ціну?')) return;
    await fetch(`/api/settings?type=fuel&id=${id}`, { method: 'DELETE' });
    fetchSettings();
  };

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="text-[#e4e2e3]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Settings size={30} className="text-[#e9c349]" />
          <div>
            <h1 className="m-0 text-3xl font-bold text-white">Налаштування CRM</h1>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Єдине місце для бізнес-даних, інтеграцій, оплат і розрахунків.</p>
          </div>
        </div>
        <button
          onClick={saveContentSettings}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#ffe175] disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'Збереження...' : 'Зберегти налаштування'}
        </button>
      </div>

      {notice && <div className="mb-6 rounded-lg border border-[#e9c349]/30 bg-[#e9c349]/10 px-4 py-3 text-sm text-[#e9c349]">{notice}</div>}

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#13131a] p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                isActive ? 'bg-[#e9c349] text-black' : 'text-[#c7c6ca] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'business' && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <Building2 className="text-[#e9c349]" /> Основні дані
            </h2>
            <div className="grid gap-4">
              <Field label="Назва бренду" value={contentSettings.brand_name} onChange={(value) => updateSetting('brand_name', value)} placeholder="First Line Transfer" hint="Показується в шапці, метаданих, повідомленнях і системних підписах." />
              <Field label="Основний телефон" value={contentSettings.contact_phone} onChange={(value) => updateSetting('contact_phone', value)} placeholder="+380..." hint="Контакт для сайту, заявок і ручної комунікації з клієнтом." />
              <Field label="Основний email" value={contentSettings.contact_email} onChange={(value) => updateSetting('contact_email', value)} placeholder="info@example.com" hint="Публічний email компанії та резервний контакт для повідомлень." />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <PlugZap className="text-[#e9c349]" /> Що тут буде далі
            </h2>
            <div className="space-y-3 text-sm leading-6 text-[#c7c6ca]">
              <p>Сюди логічно додамо глобальні дефолти сервісу: мови, країни роботи, податки, сервісні збори, дефолтне місто бази та правила бронювання.</p>
              <p>Технічні ключі, тарифи і тексти сайту розділені, щоб редактор сторінок не перетворювався на склад випадкових полів.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'pricing' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 xl:col-span-2">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <BadgeEuro className="text-[#e9c349]" /> Правила калькулятора
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Подача €/км" type="number" value={contentSettings.pricing_delivery_rate} onChange={(value) => updateSetting('pricing_delivery_rate', value)} hint="Вартість кілометра від бази авто до клієнта. Впливає на внутрішню собівартість і фінальний розрахунок." />
              <Field label="Базова подача €" type="number" value={contentSettings.pricing_delivery_base_fee} onChange={(value) => updateSetting('pricing_delivery_base_fee', value)} hint="Фіксована частина подачі авто до клієнта перед маршрутом." />
              <Field label="Митниця, год" type="number" value={contentSettings.pricing_customs_wait_hours} onChange={(value) => updateSetting('pricing_customs_wait_hours', value)} hint="Автоматично додається, коли маршрут проходить між країнами." />
              <Field label="Ручне очікування, год" type="number" value={contentSettings.pricing_manual_waiting_hours} onChange={(value) => updateSetting('pricing_manual_waiting_hours', value)} hint="Глобальний запас очікування, який додається до робочого часу водія." />
              <Field label="Буфер підготовки, хв" type="number" value={contentSettings.pricing_prep_buffer_mins} onChange={(value) => updateSetting('pricing_prep_buffer_mins', value)} hint="Час до виїзду з бази: підготовка, мийка, перевірка авто." />
              <Field label="Запас по часу, %" type="number" value={contentSettings.pricing_traffic_buffer_percent} onChange={(value) => updateSetting('pricing_traffic_buffer_percent', value)} hint="Зменшує середню швидкість у розрахунку часу, щоб врахувати затори." />
              <Field label="Клієнтська ставка €/год" type="number" value={contentSettings.pricing_time_rate_per_hour} onChange={(value) => updateSetting('pricing_time_rate_per_hour', value)} hint="Додаткова ставка за тривалий робочий час, якщо потрібно монетизувати години." />
              <Field label="Нічліг після годин" type="number" value={contentSettings.pricing_hotel_after_hours} onChange={(value) => updateSetting('pricing_hotel_after_hours', value)} hint="Після скількох годин рейсу система додає витрати на нічліг водія." />
              <Field label="Нічліг €" type="number" value={contentSettings.pricing_hotel_cost_per_night} onChange={(value) => updateSetting('pricing_hotel_cost_per_night', value)} hint="Орієнтовна вартість ночівлі водія, якщо рейс довгий." />
              <Field label="Мін. маржа 0.25 = 25%" type="number" value={contentSettings.pricing_min_margin_percent} onChange={(value) => updateSetting('pricing_min_margin_percent', value)} hint="Мінімальний прибуток поверх внутрішніх витрат. 0.25 означає 25%." />
              <Field label="Коеф. вихідних (1.2 = +20%)" type="number" value={contentSettings.weekend_coefficient} onChange={(value) => updateSetting('weekend_coefficient', value)} hint="Множник ціни для рейсів у суботу та неділю. 1 = без надбавки." />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <Globe className="text-[#e9c349]" /> Курси валют
            </h2>
            <form onSubmit={handleAddCurrency} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                required
                value={newCurrency.currency}
                onChange={(event) => setNewCurrency({ ...newCurrency, currency: event.target.value.toUpperCase() })}
                className="h-11 rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60"
                placeholder="UAH"
              />
              <input
                required
                type="number"
                step="0.0001"
                value={newCurrency.rateToEur}
                onChange={(event) => setNewCurrency({ ...newCurrency, rateToEur: Number(event.target.value) })}
                className="h-11 rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60"
                placeholder="42.50"
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-2 text-sm font-bold text-black">
                <Plus size={16} /> Додати
              </button>
            </form>
            <p className="mb-4 text-xs leading-5 text-[#6f6f78]">Курс потрібен для відображення і майбутніх рахунків у різних валютах. Базова валюта розрахунків - EUR.</p>
            <div className="space-y-2">
              {currencies.map((currency) => (
                <div key={currency.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/25 p-3">
                  <span className="font-bold text-white">
                    1 EUR = <span className="text-[#e9c349]">{currency.rateToEur}</span> {currency.currency}
                  </span>
                  <button onClick={() => handleDeleteCurrency(currency.id)} className="rounded p-2 text-red-400 hover:bg-red-400/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <Fuel className="text-[#e9c349]" /> Пальне і зарядки по країнах
            </h2>
            <form onSubmit={handleAddFuel} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input
                required
                value={newFuel.country}
                onChange={(event) => setNewFuel({ ...newFuel, country: event.target.value })}
                className="h-11 rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60"
                placeholder="Польща"
              />
              <select
                value={newFuel.fuelType}
                onChange={(event) => setNewFuel({ ...newFuel, fuelType: event.target.value })}
                className="h-11 rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60"
              >
                {fuelTypes.map((fuelType) => (
                  <option key={fuelType} value={fuelType}>
                    {fuelType}
                  </option>
                ))}
              </select>
              <input
                required
                type="number"
                step="0.01"
                value={newFuel.priceEur}
                onChange={(event) => setNewFuel({ ...newFuel, priceEur: Number(event.target.value) })}
                className="h-11 rounded-lg border border-white/10 bg-[#080818] px-3 text-sm text-white outline-none focus:border-[#e9c349]/60"
                placeholder="1.50"
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-2 text-sm font-bold text-black">
                <Plus size={16} /> Додати
              </button>
            </form>
            <p className="mb-4 text-xs leading-5 text-[#6f6f78]">Ціни використовуються тільки для внутрішньої собівартості маршруту: пальне або зарядка по країнах, через які проходить рейс.</p>
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {sortedFuelPrices.map((fuel) => (
                <div key={fuel.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/25 p-3">
                  <span className="font-bold text-white">
                    {fuel.country} <span className="font-normal text-[#8a8a93]">({fuel.fuelType})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#e9c349]">EUR {fuel.priceEur}</span>
                    <button onClick={() => handleDeleteFuel(fuel.id)} className="rounded p-2 text-red-400 hover:bg-red-400/10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'messengers' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Telegram</h2>
                <p className="mt-1 text-xs leading-5 text-[#8a8a93]">MTProto підключення: CRM читає вхідні приватні повідомлення і може відповідати з адмінки.</p>
              </div>
              <HelpLink href="https://my.telegram.org/apps">API ключі</HelpLink>
            </div>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.telegram_enabled === 'true'} onChange={(checked) => updateSetting('telegram_enabled', String(checked))} label="Увімкнути Telegram" hint="Дозволяє CRM використовувати Telegram для повідомлень і привʼязки чатів." />
              <StatusLine settingKey="telegram_last_event_at" />
              <Field label="Bot Token (сповіщення)" value={contentSettings.telegram_bot_token} onChange={(value) => updateSetting('telegram_bot_token', value)} secret placeholder="123456:ABC..." hint="Токен бота з @BotFather. Через нього CRM шле сповіщення про нові заявки і бронювання." />
              <Field label="Chat ID для сповіщень" value={contentSettings.telegram_admin_chat_id} onChange={(value) => updateSetting('telegram_admin_chat_id', value)} placeholder="123456789" hint="Твій chat id (дізнайся у @userinfobot). Сюди прилітають сповіщення. Спочатку напиши своєму боту /start." />
              <Field label="API ID" value={contentSettings.telegram_api_id} onChange={(value) => updateSetting('telegram_api_id', value)} placeholder="my.telegram.org API ID" hint="Числовий API ID з my.telegram.org для MTProto-авторизації." />
              <Field label="API Hash" value={contentSettings.telegram_api_hash} onChange={(value) => updateSetting('telegram_api_hash', value)} secret placeholder="my.telegram.org API Hash" hint="Секретний API Hash з my.telegram.org. Не показується відкритим текстом." />
              <Field label="String Session" value={contentSettings.telegram_string_session} onChange={(value) => updateSetting('telegram_string_session', value)} secret placeholder="Після авторизації MTProto" hint="Збережена сесія Telegram-акаунта/бота після авторизації. Без неї інтеграція не стартує." />
              <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-4">
                <div className="mb-3 text-sm font-bold text-white">Активація Telegram сесії</div>
                <div className="grid gap-3">
                  <Field label="Телефон Telegram" value={telegramAuth.phoneNumber} onChange={(value) => setTelegramAuth((prev) => ({ ...prev, phoneNumber: value }))} placeholder="+380..." hint="Номер акаунта Telegram, через який CRM буде читати і відправляти повідомлення." />
                  <button
                    type="button"
                    onClick={sendTelegramCode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e9c349]/40 bg-[#e9c349]/15 px-4 py-3 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/20"
                  >
                    <Send size={16} />
                    Надіслати код
                  </button>
                  <Field label="Код із Telegram" value={telegramAuth.code} onChange={(value) => setTelegramAuth((prev) => ({ ...prev, code: value }))} placeholder="12345" hint="Код, який Telegram надішле після кнопки вище." />
                  <Field label="2FA пароль, якщо є" value={telegramAuth.password} onChange={(value) => setTelegramAuth((prev) => ({ ...prev, password: value }))} secret hint="Потрібен тільки якщо на Telegram акаунті увімкнено двофакторний пароль." />
                  <button
                    type="button"
                    onClick={verifyTelegramCode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-3 text-sm font-bold text-black hover:bg-[#ffe175]"
                  >
                    <KeyRound size={16} />
                    Підтвердити Telegram
                  </button>
                  {telegramNotice && <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-[#e9c349]">{telegramNotice}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Facebook Messenger</h2>
                <p className="mt-1 text-xs leading-5 text-[#8a8a93]">Meta webhook приймає повідомлення сторінки, а CRM відповідає Page Access Token-ом.</p>
              </div>
              <HelpLink href="https://developers.facebook.com/apps/">Meta Apps</HelpLink>
            </div>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.facebook_enabled === 'true'} onChange={(checked) => updateSetting('facebook_enabled', String(checked))} label="Увімкнути Messenger" hint="Вмикає обробку Facebook Messenger через webhook." />
              <StatusLine settingKey="messenger_last_event_at" />
              <Field label="Page Access Token" value={contentSettings.facebook_page_token} onChange={(value) => updateSetting('facebook_page_token', value)} secret hint="Токен сторінки Facebook, яким CRM відповідає клієнтам." />
              <Field label="Verify Token" value={contentSettings.facebook_verify_token} onChange={(value) => updateSetting('facebook_verify_token', value)} secret hint="Секретна фраза для підтвердження webhook у Meta." />
              <CopyBox label="Callback URL для Meta webhook" value={`${publicOrigin || 'https://your-domain.com'}/api/webhooks/messenger`} hint="У Meta додай цей URL і той самий Verify Token. Підписки: messages, messaging_postbacks за потреби." />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">WhatsApp Business</h2>
                <p className="mt-1 text-xs leading-5 text-[#8a8a93]">WhatsApp Cloud API: вхідні повідомлення через webhook, відповіді через Graph API.</p>
              </div>
              <HelpLink href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started">Cloud API</HelpLink>
            </div>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.whatsapp_enabled === 'true'} onChange={(checked) => updateSetting('whatsapp_enabled', String(checked))} label="Увімкнути WhatsApp" hint="Вмикає WhatsApp Business API для заявок і переписки." />
              <StatusLine settingKey="whatsapp_last_event_at" />
              <Field label="Phone Number ID" value={contentSettings.whatsapp_phone_number_id} onChange={(value) => updateSetting('whatsapp_phone_number_id', value)} hint="ID номера WhatsApp Business у Meta." />
              <Field label="Business Account ID" value={contentSettings.whatsapp_business_account_id} onChange={(value) => updateSetting('whatsapp_business_account_id', value)} hint="ID WhatsApp Business Account у Meta." />
              <Field label="Access Token" value={contentSettings.whatsapp_access_token} onChange={(value) => updateSetting('whatsapp_access_token', value)} secret hint="Токен доступу для відправки і читання повідомлень." />
              <Field label="Verify Token" value={contentSettings.whatsapp_verify_token} onChange={(value) => updateSetting('whatsapp_verify_token', value)} secret hint="Секрет для підтвердження WhatsApp webhook." />
              <CopyBox label="Callback URL для WhatsApp webhook" value={`${publicOrigin || 'https://your-domain.com'}/api/webhooks/whatsapp`} hint="У WhatsApp configuration встав цей URL і Verify Token. Підписка потрібна на messages." />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'auth' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Google Login</h2>
                <p className="mt-1 text-xs leading-5 text-[#8a8a93]">Кнопка Google на сторінці входу зʼявиться тільки якщо увімкнено і заповнено Client ID + Secret.</p>
              </div>
              <HelpLink href="https://console.cloud.google.com/apis/credentials">Google OAuth</HelpLink>
            </div>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.google_auth_enabled === 'true'} onChange={(checked) => updateSetting('google_auth_enabled', String(checked))} label="Увімкнути Google авторизацію" hint="Дозволяє клієнтам входити через Google OAuth." />
              <Field label="Google Client ID" value={contentSettings.google_client_id} onChange={(value) => updateSetting('google_client_id', value)} hint="OAuth Client ID з Google Cloud Console." />
              <Field label="Google Client Secret" value={contentSettings.google_client_secret} onChange={(value) => updateSetting('google_client_secret', value)} secret hint="OAuth Client Secret. Зберігається в базі і не показується відкритим текстом." />
              <CopyBox label="Authorized redirect URI" value={`${publicOrigin || 'https://your-domain.com'}/api/auth/callback/google`} hint="Цей callback треба додати в Google OAuth Client." />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Facebook Login</h2>
                <p className="mt-1 text-xs leading-5 text-[#8a8a93]">Це саме логін на сайт через Facebook, не Messenger. Messenger налаштовується в сусідній вкладці.</p>
              </div>
              <HelpLink href="https://developers.facebook.com/apps/">Facebook Login</HelpLink>
            </div>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.facebook_auth_enabled === 'true'} onChange={(checked) => updateSetting('facebook_auth_enabled', String(checked))} label="Увімкнути Facebook авторизацію" hint="Дозволяє клієнтам входити через Facebook OAuth." />
              <Field label="Facebook App ID" value={contentSettings.facebook_client_id} onChange={(value) => updateSetting('facebook_client_id', value)} hint="App ID з Meta Developers." />
              <Field label="Facebook App Secret" value={contentSettings.facebook_client_secret} onChange={(value) => updateSetting('facebook_client_secret', value)} secret hint="App Secret. Не плутати з Page Access Token для Messenger." />
              <CopyBox label="Valid OAuth Redirect URI" value={`${publicOrigin || 'https://your-domain.com'}/api/auth/callback/facebook`} hint="Цей callback треба додати в Facebook Login settings." />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'payments' && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <CreditCard className="text-[#e9c349]" /> Реквізити для оплат
            </h2>
            <div className="grid gap-4">
              <Field label="Картка / IBAN" value={contentSettings.payment_card} onChange={(value) => updateSetting('payment_card', value)} placeholder="IBAN або номер картки" hint="Реквізити, які підставляються у рахунок клієнту (кнопка «Надіслати рахунок у чат» в заявці)." />
              <Field label="USDT / Crypto" value={contentSettings.payment_usdt} onChange={(value) => updateSetting('payment_usdt', value)} placeholder="TRC20/ERC20 адреса" hint="Крипто-реквізити для альтернативної оплати." />
              <Field label="Завдаток, % від ціни" type="number" value={contentSettings.deposit_percent} onChange={(value) => updateSetting('deposit_percent', value)} hint="Скільки відсотків від повної ціни система рахує як завдаток у рахунках і в кабінеті клієнта." />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xl font-bold text-white">Наступна логіка оплат</h2>
            <div className="space-y-3 text-sm leading-6 text-[#c7c6ca]">
              <p>Тут пізніше мають бути депозит, часткова оплата, статуси платежів, LiqPay/Stripe, валюта рахунку і шаблони повідомлень клієнту.</p>
              <p>Зараз ці реквізити вже використовуються у повідомленні на оплату в заявках.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
