import { prisma } from './prisma';
import { getAutoEmptyLegPromotions } from './emptyLegs';

// ---- Types (kept in sync with the marketing admin page) ----
export type PostPreset = {
  id: string;
  enabled: boolean;
  name: string;
  channel: 'instagram' | 'facebook' | 'both';
  format: string;
  kind: 'car' | 'ad' | 'empty_leg';
  timeSlots: string[];
  cta: string;
  captionTemplate: string;
  hashtags: string;
};

export type ScheduleRules = {
  timezone: string;
  enabled: boolean;
  maxPostsPerDay: number;
  minHoursBetweenPosts: number;
  sameRouteCooldownHours: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  randomizeMinutes: number;
};

export type PublishResult = {
  ok: boolean;
  channels: { channel: string; ok: boolean; error?: string }[];
  caption: string;
  skipped?: string;
};

const money = (value?: number | null) => (value ? `€${Math.round(value)}` : '');

async function settingsMap(keys: string[]) {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, string>;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return (JSON.parse(value) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

// Builds the caption + picks a media image for a preset from live data.
async function buildPost(preset: PostPreset, siteUrl: string): Promise<{ caption: string; imageUrl?: string } | null> {
  const base = siteUrl.replace(/\/+$/, '');
  const carCover = (car: any) => car?.media?.[0]?.url || car?.images?.[0] || undefined;
  let values: Record<string, string> = { url: base };
  let imageUrl: string | undefined;

  if (preset.kind === 'car') {
    const cars = await prisma.car.findMany({
      where: { status: 'AVAILABLE' },
      include: { media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }], take: 1 } },
    });
    if (cars.length === 0) return null;
    const car = cars[Math.floor(Math.random() * cars.length)];
    values = {
      url: `${base}/cars/${car.slug || car.id}`,
      carName: `${car.make} ${car.model}`,
      comfortClass: car.comfortClass || '',
      capacity: String(car.capacity ?? ''),
      luggage: String(car.luggageCapacity ?? ''),
    };
    imageUrl = carCover(car);
  } else if (preset.kind === 'empty_leg') {
    const promos = await getAutoEmptyLegPromotions();
    const active = promos.filter((p) => p.active);
    if (active.length === 0) return null;
    const promo = active[0];
    values = {
      url: `${base}/?promo=${promo.discount}&promoCode=${promo.id}&carId=${promo.carId || ''}#calculator`,
      discount: String(promo.discount),
      routeFrom: promo.routeFrom || '',
      routeTo: promo.routeTo || '',
      date: promo.dateStart ? new Date(promo.dateStart).toLocaleDateString('uk-UA') : '',
      carName: promo.car ? `${promo.car.make} ${promo.car.model}` : '',
      oldPrice: money(promo.originalPrice),
      newPrice: money(promo.discountedPrice),
    };
    imageUrl = carCover(promo.car);
  }

  const caption = `${fill(preset.captionTemplate, values)}\n\n${preset.hashtags || ''}`.trim();
  return { caption, imageUrl };
}

async function postTelegram(chatId: string, botToken: string, text: string, imageUrl?: string) {
  const api = `https://api.telegram.org/bot${botToken}/`;
  const res = imageUrl
    ? await fetch(`${api}sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: text }),
      })
    : await fetch(`${api}sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.description || `HTTP ${res.status}`);
}

async function postFacebook(pageId: string, token: string, text: string, imageUrl?: string) {
  const url = imageUrl
    ? `https://graph.facebook.com/v20.0/${pageId}/photos`
    : `https://graph.facebook.com/v20.0/${pageId}/feed`;
  const body = imageUrl ? { url: imageUrl, caption: text, access_token: token } : { message: text, access_token: token };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error?.message || `HTTP ${res.status}`);
}

// Publishes a single preset to its configured channels right now.
export async function publishPreset(preset: PostPreset): Promise<PublishResult> {
  const cfg = await settingsMap([
    'site_url', 'telegram_bot_token', 'marketing_telegram_chat_id',
    'facebook_page_token', 'facebook_page_id',
  ]);

  const post = await buildPost(preset, cfg.site_url || 'https://first-line-transfer.com');
  if (!post) return { ok: false, channels: [], caption: '', skipped: 'Немає даних для поста (авто або акції).' };

  const channels: PublishResult['channels'] = [];
  const wantsFacebook = preset.channel === 'facebook' || preset.channel === 'both';
  const wantsTelegram = true; // Telegram канал використовуємо як основний майданчик

  if (wantsTelegram && cfg.marketing_telegram_chat_id && cfg.telegram_bot_token) {
    try {
      await postTelegram(cfg.marketing_telegram_chat_id, cfg.telegram_bot_token, post.caption, post.imageUrl);
      channels.push({ channel: 'telegram', ok: true });
    } catch (err) {
      channels.push({ channel: 'telegram', ok: false, error: err instanceof Error ? err.message : 'error' });
    }
  }

  if (wantsFacebook && cfg.facebook_page_token && cfg.facebook_page_id) {
    try {
      await postFacebook(cfg.facebook_page_id, cfg.facebook_page_token, post.caption, post.imageUrl);
      channels.push({ channel: 'facebook', ok: true });
    } catch (err) {
      channels.push({ channel: 'facebook', ok: false, error: err instanceof Error ? err.message : 'error' });
    }
  }

  if (channels.length === 0) {
    return { ok: false, channels, caption: post.caption, skipped: 'Канали не налаштовані (Telegram chat id / FB сторінка).' };
  }
  return { ok: channels.some((c) => c.ok), channels, caption: post.caption };
}

type LogEntry = { key: string; at: string; presetId: string; presetName: string; result: string };

async function appendLog(entry: LogEntry) {
  const row = await prisma.siteContent.findUnique({ where: { key: 'marketing_post_log' } });
  const log = parseJson<LogEntry[]>(row?.value, []);
  const next = [entry, ...log].slice(0, 60); // keep last 60
  await prisma.siteContent.upsert({
    where: { key: 'marketing_post_log' },
    update: { value: JSON.stringify(next) },
    create: { key: 'marketing_post_log', value: JSON.stringify(next) },
  });
}

// Time parts (HH:MM and YYYY-MM-DD) in a given IANA timezone.
function nowInTz(tz: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hm: `${parts.hour}:${parts.minute}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const toMinutes = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

function inQuietHours(nowMin: number, start: string, end: string) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return s > e ? nowMin >= s || nowMin < e : nowMin >= s && nowMin < e; // handles overnight window
}

// The scheduler brain: called by a cron ping. Posts at most one due preset per run.
export async function runScheduledPosts(windowMinutes = 20): Promise<PublishResult & { ran: boolean }> {
  const cfg = await settingsMap(['marketing_post_presets', 'marketing_schedule_rules', 'marketing_post_log']);
  const rules = parseJson<ScheduleRules>(cfg.marketing_schedule_rules, {} as ScheduleRules);
  const presets = parseJson<PostPreset[]>(cfg.marketing_post_presets, []);
  const log = parseJson<LogEntry[]>(cfg.marketing_post_log, []);

  if (!rules.enabled) return { ran: false, ok: false, channels: [], caption: '', skipped: 'Автопланування вимкнено.' };

  const tz = rules.timezone || 'Europe/Kyiv';
  const { date, minutes } = nowInTz(tz);

  if (rules.quietHoursStart && rules.quietHoursEnd && inQuietHours(minutes, rules.quietHoursStart, rules.quietHoursEnd)) {
    return { ran: false, ok: false, channels: [], caption: '', skipped: 'Тихі години.' };
  }

  const todayPosts = log.filter((e) => e.key.startsWith(`${date}|`));
  if (rules.maxPostsPerDay && todayPosts.length >= rules.maxPostsPerDay) {
    return { ran: false, ok: false, channels: [], caption: '', skipped: 'Ліміт постів на сьогодні досягнуто.' };
  }
  const lastAt = log[0] ? new Date(log[0].at).getTime() : 0;
  if (rules.minHoursBetweenPosts && Date.now() - lastAt < rules.minHoursBetweenPosts * 3600_000) {
    return { ran: false, ok: false, channels: [], caption: '', skipped: 'Ще не минув інтервал між постами.' };
  }

  // Find an enabled preset with a slot that has just come due and wasn't posted today
  for (const preset of presets.filter((p) => p.enabled)) {
    for (const slot of preset.timeSlots || []) {
      const slotMin = toMinutes(slot);
      const due = minutes >= slotMin && minutes < slotMin + windowMinutes;
      const key = `${date}|${preset.id}|${slot}`;
      if (due && !log.some((e) => e.key === key)) {
        const result = await publishPreset(preset);
        await appendLog({
          key,
          at: new Date().toISOString(),
          presetId: preset.id,
          presetName: preset.name,
          result: result.ok ? `OK: ${result.channels.filter((c) => c.ok).map((c) => c.channel).join(', ')}` : (result.skipped || 'помилка'),
        });
        return { ran: true, ...result };
      }
    }
  }

  return { ran: false, ok: false, channels: [], caption: '', skipped: 'Немає постів, час яких настав.' };
}
