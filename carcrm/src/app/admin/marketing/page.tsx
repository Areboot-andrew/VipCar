"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  Clock3,
  ExternalLink,
  ImageIcon,
  Megaphone,
  Plus,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import CroppedImageUploader from "@/components/admin/CroppedImageUploader";

type ContentSettings = Record<string, string>;

type UploadedAsset = {
  label: string;
  url: string;
  width?: number;
  height?: number;
  size?: number;
};

type PostPreset = {
  id: string;
  enabled: boolean;
  name: string;
  channel: "instagram" | "facebook" | "both";
  format: "square" | "story" | "landscape";
  kind: "car" | "ad" | "empty_leg";
  timeSlots: string[];
  cta: string;
  captionTemplate: string;
  hashtags: string;
};

type ScheduleRules = {
  timezone: string;
  enabled: boolean;
  maxPostsPerDay: number;
  minHoursBetweenPosts: number;
  sameRouteCooldownHours: number;
  emptyLegAdvanceDays: number;
  emptyLegSlots: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
  randomizeMinutes: number;
};

const defaultPresets: PostPreset[] = [
  {
    id: "instagram-car-basic",
    enabled: true,
    name: "Instagram авто: базовий пост",
    channel: "instagram",
    format: "square",
    kind: "car",
    timeSlots: ["10:30", "18:30"],
    cta: "Переглянути авто на сайті",
    captionTemplate: "Преміум авто з водієм для комфортної поїздки.\n\n{carName}\nКлас: {comfortClass}\nМісць: {capacity}\nБагаж: {luggage}\n\nБронювання: {url}",
    hashtags: "#firstlinetransfer #viptransfer #premiumcar #transfer",
  },
  {
    id: "instagram-brand-ad",
    enabled: true,
    name: "Instagram реклама: сервіс",
    channel: "instagram",
    format: "story",
    kind: "ad",
    timeSlots: ["12:30", "20:30"],
    cta: "Розрахувати поїздку",
    captionTemplate: "First Line Transfer: авто з водієм для міжміських та міжнародних поїздок.\n\nМаршрут, час прибуття і доступне авто можна обрати онлайн.\n\n{url}",
    hashtags: "#firstlinetransfer #chauffeurservice #vipservice #ukrainetransfer",
  },
  {
    id: "instagram-empty-leg",
    enabled: true,
    name: "Instagram Empty Legs: акційний маршрут",
    channel: "both",
    format: "landscape",
    kind: "empty_leg",
    timeSlots: ["09:15", "14:30", "19:15"],
    cta: "Забронювати зі знижкою",
    captionTemplate: "Вільний зворотний рейс зі знижкою {discount}%.\n\n{routeFrom} -> {routeTo}\nДата: {date}\nАвто: {carName}\nСтара ціна: {oldPrice}\nАкційна ціна: {newPrice}\n\n{url}",
    hashtags: "#emptylegs #firstlinetransfer #transferdeal #viptransfer",
  },
];

const defaultScheduleRules: ScheduleRules = {
  timezone: "Europe/Kyiv",
  enabled: true,
  maxPostsPerDay: 3,
  minHoursBetweenPosts: 4,
  sameRouteCooldownHours: 18,
  emptyLegAdvanceDays: 7,
  emptyLegSlots: ["09:15", "14:30", "19:15"],
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  randomizeMinutes: 12,
};

function statusPill(active: boolean) {
  return active
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : "border-red-400/30 bg-red-400/10 text-red-200";
}

function readJsonSetting<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

function normalizeTimes(times: string[]) {
  return Array.from(new Set(times.filter(Boolean))).sort();
}

export default function MarketingPage() {
  const [settings, setSettings] = useState<ContentSettings>({});
  const [postPresets, setPostPresets] = useState<PostPreset[]>(defaultPresets);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRules>(defaultScheduleRules);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const nextSettings = data.contentSettings || {};
        setSettings(nextSettings);
        setPostPresets(readJsonSetting<PostPreset[]>(nextSettings.marketing_post_presets, defaultPresets));
        setScheduleRules(readJsonSetting<ScheduleRules>(nextSettings.marketing_schedule_rules, defaultScheduleRules));
      })
      .catch(() => setSettings({}));
  }, []);

  const facebookReady = settings.facebook_enabled === "true" && settings.facebook_page_token;
  const whatsappReady = settings.whatsapp_enabled === "true" && settings.whatsapp_access_token;
  const facebookLoginReady = settings.facebook_auth_enabled === "true" && settings.facebook_client_id && settings.facebook_client_secret;

  const addAsset = (label: string, data: { url: string; width?: number; height?: number; size?: number }) => {
    setAssets((prev) => [{ label, ...data }, ...prev].slice(0, 12));
  };

  const updatePreset = (id: string, patch: Partial<PostPreset>) => {
    setPostPresets((prev) => prev.map((preset) => preset.id === id ? { ...preset, ...patch } : preset));
  };

  const updatePresetTime = (id: string, index: number, value: string) => {
    setPostPresets((prev) => prev.map((preset) => {
      if (preset.id !== id) return preset;
      const timeSlots = [...preset.timeSlots];
      timeSlots[index] = value;
      return { ...preset, timeSlots: normalizeTimes(timeSlots) };
    }));
  };

  const addPresetTime = (id: string) => {
    setPostPresets((prev) => prev.map((preset) => preset.id === id ? { ...preset, timeSlots: normalizeTimes([...preset.timeSlots, "12:00"]) } : preset));
  };

  const removePresetTime = (id: string, index: number) => {
    setPostPresets((prev) => prev.map((preset) => preset.id === id ? { ...preset, timeSlots: preset.timeSlots.filter((_, i) => i !== index) } : preset));
  };

  const addPreset = () => {
    const id = `custom-${Date.now()}`;
    setPostPresets((prev) => [
      ...prev,
      {
        id,
        enabled: true,
        name: "Новий рекламний пресет",
        channel: "instagram",
        format: "square",
        kind: "ad",
        timeSlots: ["11:30"],
        cta: "Написати менеджеру",
        captionTemplate: "Короткий рекламний текст.\n\n{url}",
        hashtags: "#firstlinetransfer #viptransfer",
      },
    ]);
  };

  const saveMarketingSettings = async () => {
    setSaving(true);
    setSaved(false);
    const nextSettings = {
      ...settings,
      marketing_post_presets: JSON.stringify(postPresets.map((preset) => ({ ...preset, timeSlots: normalizeTimes(preset.timeSlots) }))),
      marketing_schedule_rules: JSON.stringify({ ...scheduleRules, emptyLegSlots: normalizeTimes(scheduleRules.emptyLegSlots) }),
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contentSettings", settings: nextSettings }),
    });

    if (res.ok) {
      setSettings(nextSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
    setSaving(false);
  };

  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishNote, setPublishNote] = useState("");

  const updateSetting = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const publishNow = async (preset: PostPreset) => {
    setPublishing(preset.id);
    setPublishNote("");
    try {
      // Save first so the engine posts the current template/channels
      await saveMarketingSettings();
      const res = await fetch("/api/marketing/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId: preset.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishNote(`✓ «${preset.name}» опубліковано: ${data.channels.filter((c: any) => c.ok).map((c: any) => c.channel).join(", ")}`);
      } else {
        const errs = (data.channels || []).filter((c: any) => !c.ok).map((c: any) => `${c.channel}: ${c.error}`).join("; ");
        setPublishNote(`✗ ${data.skipped || data.error || errs || "не опубліковано"}`);
      }
    } catch {
      setPublishNote("✗ Помилка публікації.");
    } finally {
      setPublishing(null);
    }
  };

  const enabledPresets = postPresets.filter((preset) => preset.enabled).length;
  const postLog = readJsonSetting<{ at: string; presetName: string; result: string }[]>(settings.marketing_post_log, []);

  return (
    <div className="min-h-screen text-[#e4e2e3]">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Соцмережі і автопости</h1>
            <p className="m-0 mt-1 text-sm text-[#8a8a93]">Підготовка Meta-підключення, банерів, фото і відео для Facebook / Instagram / Empty Legs.</p>
          </div>
        </div>
        <Link href="/admin/settings" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e9c349]/40 px-4 py-3 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349] hover:text-black">
          <Settings size={18} />
          Ключі інтеграцій
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <ImageIcon className="text-[#e9c349]" size={22} />
                  Медіа-пресети для соцмереж
                </h2>
                <p className="mt-1 text-sm text-[#8a8a93]">Фото підрізається в адмінці, потім сервер оптимізує його у WebP потрібного розміру.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
                <div className="mb-3 text-sm font-bold text-white">Instagram / Facebook квадрат</div>
                <p className="mb-4 text-xs leading-5 text-[#8a8a93]">1080x1080. Для постів авто, акцій і коротких оголошень.</p>
                <CroppedImageUploader buttonLabel="Підготувати 1:1" preset="social-square" onUploaded={(data) => addAsset("1:1 пост", data)} />
              </div>
              <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
                <div className="mb-3 text-sm font-bold text-white">Stories / Reels cover</div>
                <p className="mb-4 text-xs leading-5 text-[#8a8a93]">1080x1920. Для вертикальних банерів Empty Legs.</p>
                <CroppedImageUploader buttonLabel="Підготувати 9:16" preset="social-story" onUploaded={(data) => addAsset("9:16 story", data)} />
              </div>
              <div className="rounded-xl border border-white/10 bg-[#080818] p-4">
                <div className="mb-3 text-sm font-bold text-white">Facebook link preview</div>
                <p className="mb-4 text-xs leading-5 text-[#8a8a93]">1200x630. Для посилань на авто, галерею або акційний маршрут.</p>
                <CroppedImageUploader buttonLabel="Підготувати 1200x630" preset="social-landscape" onUploaded={(data) => addAsset("1200x630 link", data)} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <Megaphone className="text-[#e9c349]" size={22} />
                  Пресети Instagram / Facebook постів
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#8a8a93]">
                  Базові шаблони для авто, реклами сервісу і Empty Legs. Змінні типу <code className="text-[#e9c349]">{'{routeFrom}'}</code>, <code className="text-[#e9c349]">{'{carName}'}</code>, <code className="text-[#e9c349]">{'{url}'}</code> система підставлятиме при генерації чернетки.
                </p>
              </div>
              <button type="button" onClick={addPreset} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e9c349]/40 px-4 py-3 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349] hover:text-black">
                <Plus size={17} />
                Додати пресет
              </button>
            </div>

            <div className="grid gap-4">
              {postPresets.map((preset) => (
                <div key={preset.id} className="rounded-xl border border-white/10 bg-[#080818] p-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="min-w-0 space-y-4">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                        <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                          Назва пресету
                          <input value={preset.name} onChange={(e) => updatePreset(preset.id, { name: e.target.value })} className="rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm font-bold text-white">
                          <input type="checkbox" checked={preset.enabled} onChange={(e) => updatePreset(preset.id, { enabled: e.target.checked })} className="h-5 w-5 accent-[#e9c349]" />
                          Активний
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                          Канал
                          <select value={preset.channel} onChange={(e) => updatePreset(preset.id, { channel: e.target.value as PostPreset["channel"] })} className="rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60">
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="both">Instagram + Facebook</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                          Формат
                          <select value={preset.format} onChange={(e) => updatePreset(preset.id, { format: e.target.value as PostPreset["format"] })} className="rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60">
                            <option value="square">1:1 пост</option>
                            <option value="story">9:16 story</option>
                            <option value="landscape">1200x630</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                          Тип
                          <select value={preset.kind} onChange={(e) => updatePreset(preset.id, { kind: e.target.value as PostPreset["kind"] })} className="rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60">
                            <option value="car">Авто</option>
                            <option value="ad">Реклама</option>
                            <option value="empty_leg">Акційний маршрут</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                          CTA
                          <input value={preset.cta} onChange={(e) => updatePreset(preset.id, { cta: e.target.value })} className="rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                        </label>
                      </div>

                      <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                        Текст поста
                        <textarea rows={7} value={preset.captionTemplate} onChange={(e) => updatePreset(preset.id, { captionTemplate: e.target.value })} className="min-h-[160px] resize-y rounded-lg border border-white/10 bg-[#13131a] px-3 py-3 text-sm normal-case leading-6 tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                      </label>

                      <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                        Хештеги
                        <textarea rows={2} value={preset.hashtags} onChange={(e) => updatePreset(preset.id, { hashtags: e.target.value })} className="resize-y rounded-lg border border-white/10 bg-[#13131a] px-3 py-3 text-sm normal-case leading-6 tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <Clock3 size={16} className="text-[#e9c349]" />
                            Часи постингу
                          </div>
                          <button type="button" onClick={() => addPresetTime(preset.id)} className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-[#e9c349] hover:border-[#e9c349]/50">
                            +
                          </button>
                        </div>
                        <div className="grid gap-2">
                          {preset.timeSlots.map((slot, index) => (
                            <div key={`${preset.id}-${index}`} className="flex items-center gap-2">
                              <input type="time" value={slot} onChange={(e) => updatePresetTime(preset.id, index, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm text-white outline-none focus:border-[#e9c349]/60" />
                              <button type="button" onClick={() => removePresetTime(preset.id, index)} className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button type="button" onClick={() => publishNow(preset)} disabled={publishing === preset.id} className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-3 py-2 text-sm font-bold text-black disabled:opacity-60">
                        <Send size={15} /> {publishing === preset.id ? "Публікуємо..." : "Опублікувати зараз"}
                      </button>
                      <button type="button" onClick={() => setPostPresets((prev) => prev.filter((item) => item.id !== preset.id))} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-sm font-bold text-red-200 hover:bg-red-400/10">
                        <Trash2 size={15} />
                        Видалити пресет
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-white">
                  <CalendarClock className="text-[#e9c349]" size={22} />
                  Розклад і антиспам
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#8a8a93]">
                  Акційні маршрути можна розкидати по різних годинах, але не спамити: ліміт на день, пауза між постами і cooldown для того самого маршруту.
                </p>
              </div>
              <div className={`rounded-lg border px-3 py-2 text-sm font-bold ${statusPill(scheduleRules.enabled)}`}>
                {scheduleRules.enabled ? "Автопланування увімкнено" : "Автопланування вимкнено"}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#080818] px-3 py-3 text-sm font-bold text-white">
                  <input type="checkbox" checked={scheduleRules.enabled} onChange={(e) => setScheduleRules({ ...scheduleRules, enabled: e.target.checked })} className="h-5 w-5 accent-[#e9c349]" />
                  Увімкнути правила
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Часовий пояс
                  <input value={scheduleRules.timezone} onChange={(e) => setScheduleRules({ ...scheduleRules, timezone: e.target.value })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Акції за днів до рейсу
                  <input type="number" min={1} max={30} value={scheduleRules.emptyLegAdvanceDays} onChange={(e) => setScheduleRules({ ...scheduleRules, emptyLegAdvanceDays: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Макс. постів на день
                  <input type="number" min={1} max={12} value={scheduleRules.maxPostsPerDay} onChange={(e) => setScheduleRules({ ...scheduleRules, maxPostsPerDay: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Пауза між постами, год
                  <input type="number" min={1} max={24} value={scheduleRules.minHoursBetweenPosts} onChange={(e) => setScheduleRules({ ...scheduleRules, minHoursBetweenPosts: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Cooldown маршруту, год
                  <input type="number" min={1} max={168} value={scheduleRules.sameRouteCooldownHours} onChange={(e) => setScheduleRules({ ...scheduleRules, sameRouteCooldownHours: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Тиша з
                  <input type="time" value={scheduleRules.quietHoursStart} onChange={(e) => setScheduleRules({ ...scheduleRules, quietHoursStart: e.target.value })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Тиша до
                  <input type="time" value={scheduleRules.quietHoursEnd} onChange={(e) => setScheduleRules({ ...scheduleRules, quietHoursEnd: e.target.value })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                  Рандомізація, хв
                  <input type="number" min={0} max={60} value={scheduleRules.randomizeMinutes} onChange={(e) => setScheduleRules({ ...scheduleRules, randomizeMinutes: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                </label>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#080818] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-white">Години Empty Legs</div>
                  <button type="button" onClick={() => setScheduleRules({ ...scheduleRules, emptyLegSlots: normalizeTimes([...scheduleRules.emptyLegSlots, "16:00"]) })} className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-[#e9c349] hover:border-[#e9c349]/50">
                    +
                  </button>
                </div>
                <div className="grid gap-2">
                  {scheduleRules.emptyLegSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="time" value={slot} onChange={(e) => {
                        const next = [...scheduleRules.emptyLegSlots];
                        next[index] = e.target.value;
                        setScheduleRules({ ...scheduleRules, emptyLegSlots: normalizeTimes(next) });
                      }} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#13131a] px-3 py-2 text-sm text-white outline-none focus:border-[#e9c349]/60" />
                      <button type="button" onClick={() => setScheduleRules({ ...scheduleRules, emptyLegSlots: scheduleRules.emptyLegSlots.filter((_, i) => i !== index) })} className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#8a8a93]">
                Активних пресетів: <strong className="text-white">{enabledPresets}</strong>. Empty Legs не повторює той самий маршрут частіше ніж раз на <strong className="text-white">{scheduleRules.sameRouteCooldownHours} год</strong>.
              </div>
              <button type="button" onClick={saveMarketingSettings} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-5 py-3 text-sm font-black text-black disabled:opacity-60">
                {saving ? "Збереження..." : saved ? "Збережено" : "Зберегти пресети"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Send className="text-[#e9c349]" size={22} />
              Канали автопостингу і запуск
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a7a6ad]">
              Пости публікуються у Telegram-канал (через бота) і/або на Facebook-сторінку. Instagram через API окремо — поки шлемо Telegram + Facebook.
            </p>

            {publishNote && (
              <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${publishNote.startsWith("✓") ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
                {publishNote}
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                Telegram канал (chat id або @username)
                <input value={settings.marketing_telegram_chat_id || ""} onChange={(e) => updateSetting("marketing_telegram_chat_id", e.target.value)} placeholder="@mychannel або -1001234567890" className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                <span className="text-[11px] normal-case tracking-normal text-[#6f6f78]">Бот має бути адміном каналу. Токен бота — у Налаштування → Месенджери.</span>
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                Секрет для cron
                <input value={settings.marketing_cron_secret || ""} onChange={(e) => updateSetting("marketing_cron_secret", e.target.value)} placeholder="довільний рядок-пароль" className="rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e9c349]/60" />
                <span className="text-[11px] normal-case tracking-normal text-[#6f6f78]">Захищає URL запуску. Без нього автопостинг за розкладом не працює.</span>
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Автопостинг працює автоматично
              </div>
              <div className="text-[11px] leading-5 text-[#a7a6ad]">
                Сервер сам перевіряє розклад кожні 5 хв і публікує пост, час якого настав (з урахуванням тихих годин, ліміту на день і паузи). Зовнішній cron не потрібен. «Опублікувати зараз» на пресеті — публікує негайно вручну.
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-[#080818] p-4">
              <div className="mb-2 text-sm font-bold text-white">Резервний зовнішній тригер (необов'язково)</div>
              <code className="block break-all rounded-md bg-black/40 px-3 py-2 text-xs text-[#e9c349]">
                {origin || "https://your-domain"}/api/marketing/run?key={settings.marketing_cron_secret || "ВАШ_СЕКРЕТ"}
              </code>
              <div className="mt-2 text-[11px] leading-5 text-[#6f6f78]">
                Якщо колись сервер працюватиме в кількох інстансах — цей URL можна повісити на cron-job.org як єдину точку запуску.
              </div>
            </div>

            {postLog.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-bold text-white">Останні публікації</div>
                <div className="grid gap-2">
                  {postLog.slice(0, 8).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#080818] px-3 py-2 text-xs">
                      <span className="text-[#c7c6ca]">{entry.presetName}</span>
                      <span className="flex items-center gap-3">
                        <span className={entry.result?.startsWith("OK") ? "text-emerald-300" : "text-red-200"}>{entry.result}</span>
                        <span className="text-[#6f6f78]">{new Date(entry.at).toLocaleString("uk-UA")}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <ImageIcon className="text-[#e9c349]" size={22} />
              Останні підготовлені файли
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <a key={asset.url} href={asset.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10 bg-[#080818]">
                    <div className="aspect-[4/3] overflow-hidden bg-black">
                      <img src={asset.url} alt={asset.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-white">{asset.label}</div>
                      <div className="mt-1 text-xs text-[#8a8a93]">{asset.width || 0}x{asset.height || 0} · {Math.round((asset.size || 0) / 1024)} KB</div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-[#8a8a93] sm:col-span-2 xl:col-span-3">
                  Підготуй перший файл через пресети вище.
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <BadgeCheck className="text-[#e9c349]" size={22} />
              Готовність Meta
            </h2>
            <div className="mt-4 grid gap-3">
              <div className={`rounded-lg border px-3 py-3 ${statusPill(Boolean(facebookReady))}`}>
                Facebook Page API: {facebookReady ? "готово" : "потрібен Page Token"}
              </div>
              <div className={`rounded-lg border px-3 py-3 ${statusPill(Boolean(facebookLoginReady))}`}>
                Facebook Login: {facebookLoginReady ? "готово" : "потрібні App ID/Secret"}
              </div>
              <div className={`rounded-lg border px-3 py-3 ${statusPill(Boolean(whatsappReady))}`}>
                WhatsApp API: {whatsappReady ? "готово" : "потрібен token/phone id"}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Send className="text-[#e9c349]" size={22} />
              Посилання для заявок
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <code className="block break-all rounded-lg bg-[#080818] p-3 text-[#e9c349]">{origin || "https://your-domain.com"}/gallery</code>
              <code className="block break-all rounded-lg bg-[#080818] p-3 text-[#e9c349]">{origin || "https://your-domain.com"}/#calculator</code>
              <code className="block break-all rounded-lg bg-[#080818] p-3 text-[#e9c349]">{origin || "https://your-domain.com"}/api/webhooks/messenger</code>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#13131a] p-5">
            <h2 className="text-xl font-black text-white">Що підключити в Meta</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-[#c7c6ca] hover:text-white">
                Meta Developers
                <ExternalLink size={15} />
              </a>
              <a href="https://developers.facebook.com/docs/pages-api/posts" target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-[#c7c6ca] hover:text-white">
                Facebook Page posts API
                <ExternalLink size={15} />
              </a>
              <a href="https://developers.facebook.com/docs/instagram-platform/content-publishing" target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-[#c7c6ca] hover:text-white">
                Instagram content publishing
                <ExternalLink size={15} />
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
