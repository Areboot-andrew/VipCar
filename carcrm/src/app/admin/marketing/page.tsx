"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  ImageIcon,
  Megaphone,
  Send,
  Settings,
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

function statusPill(active: boolean) {
  return active
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : "border-red-400/30 bg-red-400/10 text-red-200";
}

export default function MarketingPage() {
  const [settings, setSettings] = useState<ContentSettings>({});
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.contentSettings || {}))
      .catch(() => setSettings({}));
  }, []);

  const facebookReady = settings.facebook_enabled === "true" && settings.facebook_page_token;
  const whatsappReady = settings.whatsapp_enabled === "true" && settings.whatsapp_access_token;
  const facebookLoginReady = settings.facebook_auth_enabled === "true" && settings.facebook_client_id && settings.facebook_client_secret;

  const addAsset = (label: string, data: { url: string; width?: number; height?: number; size?: number }) => {
    setAssets((prev) => [{ label, ...data }, ...prev].slice(0, 12));
  };

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
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <CalendarClock className="text-[#e9c349]" size={22} />
              Автопости Empty Legs
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a7a6ad]">
              Наступний крок: CRM бере автоматичну акцію Empty Legs, фото авто, маршрут, стару/нову ціну і генерує чернетку поста. Тут буде список чернеток, preview банера і кнопки публікації в Facebook Page / Instagram.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-bold text-white">Джерело</div>
                <div className="mt-1 text-xs text-[#8a8a93]">Автоматичні Empty Legs із бронювань.</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-bold text-white">Креатив</div>
                <div className="mt-1 text-xs text-[#8a8a93]">Фото авто + карта маршруту + стара/нова ціна.</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-bold text-white">Дія клієнта</div>
                <div className="mt-1 text-xs text-[#8a8a93]">Клік на сайт, галерею, авто або Messenger/WhatsApp.</div>
              </div>
            </div>
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
