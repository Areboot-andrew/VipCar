'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  BadgeEuro,
  Building2,
  CreditCard,
  Fuel,
  Globe,
  MessageSquare,
  PlugZap,
  Plus,
  Save,
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

type TabId = 'business' | 'pricing' | 'messengers' | 'payments';

const tabs: { id: TabId; label: string; icon: ElementType }[] = [
  { id: 'business', label: 'Бізнес', icon: Building2 },
  { id: 'pricing', label: 'Ціни і валюти', icon: BadgeEuro },
  { id: 'messengers', label: 'Месенджери', icon: MessageSquare },
  { id: 'payments', label: 'Оплата', icon: CreditCard },
];

const defaultContentSettings: Record<string, string> = {
  brand_name: '',
  contact_phone: '',
  contact_email: '',
  payment_card: '',
  payment_usdt: '',
  telegram_enabled: 'false',
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
};

const fuelTypes = ['Бензин', 'Дизель', 'Газ', 'Електро'];

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  secret = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  secret?: boolean;
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
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#e9c349]"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [contentSettings, setContentSettings] = useState(defaultContentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
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
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setContentSettings((prev) => ({ ...prev, [key]: value }));
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
    } catch (err) {
      console.error(err);
      setNotice('Не вдалося зберегти налаштування.');
    } finally {
      setSaving(false);
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
    <div className="p-4 md:p-8">
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
              <Field label="Назва бренду" value={contentSettings.brand_name} onChange={(value) => updateSetting('brand_name', value)} placeholder="First Line Transfer" />
              <Field label="Основний телефон" value={contentSettings.contact_phone} onChange={(value) => updateSetting('contact_phone', value)} placeholder="+380..." />
              <Field label="Основний email" value={contentSettings.contact_email} onChange={(value) => updateSetting('contact_email', value)} placeholder="info@example.com" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <PlugZap className="text-[#e9c349]" /> Що тут буде далі
            </h2>
            <div className="space-y-3 text-sm leading-6 text-[#c7c6ca]">
              <p>Сюди логічно додамо глобальні дефолти сервісу: мови, країни роботи, податки, сервісні збори, дефолтне місто бази та правила бронювання.</p>
              <p>Технічні ключі більше не треба змішувати з редактором сторінок у CMS.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'pricing' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
            <h2 className="mb-5 text-xl font-bold text-white">Telegram</h2>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.telegram_enabled === 'true'} onChange={(checked) => updateSetting('telegram_enabled', String(checked))} label="Увімкнути Telegram" />
              <Field label="API ID" value={contentSettings.telegram_api_id} onChange={(value) => updateSetting('telegram_api_id', value)} placeholder="my.telegram.org API ID" />
              <Field label="API Hash" value={contentSettings.telegram_api_hash} onChange={(value) => updateSetting('telegram_api_hash', value)} secret placeholder="my.telegram.org API Hash" />
              <Field label="String Session" value={contentSettings.telegram_string_session} onChange={(value) => updateSetting('telegram_string_session', value)} secret placeholder="Після авторизації MTProto" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xl font-bold text-white">Facebook Messenger</h2>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.facebook_enabled === 'true'} onChange={(checked) => updateSetting('facebook_enabled', String(checked))} label="Увімкнути Messenger" />
              <Field label="Page Access Token" value={contentSettings.facebook_page_token} onChange={(value) => updateSetting('facebook_page_token', value)} secret />
              <Field label="Verify Token" value={contentSettings.facebook_verify_token} onChange={(value) => updateSetting('facebook_verify_token', value)} secret />
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[#8a8a93]">
                Webhook: <span className="text-[#c7c6ca]">/api/webhooks/messenger</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xl font-bold text-white">WhatsApp Business</h2>
            <div className="grid gap-4">
              <Toggle checked={contentSettings.whatsapp_enabled === 'true'} onChange={(checked) => updateSetting('whatsapp_enabled', String(checked))} label="Увімкнути WhatsApp" />
              <Field label="Phone Number ID" value={contentSettings.whatsapp_phone_number_id} onChange={(value) => updateSetting('whatsapp_phone_number_id', value)} />
              <Field label="Business Account ID" value={contentSettings.whatsapp_business_account_id} onChange={(value) => updateSetting('whatsapp_business_account_id', value)} />
              <Field label="Access Token" value={contentSettings.whatsapp_access_token} onChange={(value) => updateSetting('whatsapp_access_token', value)} secret />
              <Field label="Verify Token" value={contentSettings.whatsapp_verify_token} onChange={(value) => updateSetting('whatsapp_verify_token', value)} secret />
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
              <Field label="Картка / IBAN" value={contentSettings.payment_card} onChange={(value) => updateSetting('payment_card', value)} placeholder="IBAN або номер картки" />
              <Field label="USDT / Crypto" value={contentSettings.payment_usdt} onChange={(value) => updateSetting('payment_usdt', value)} placeholder="TRC20/ERC20 адреса" />
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
