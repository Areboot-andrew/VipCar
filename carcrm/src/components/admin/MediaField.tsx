'use client';

import { useMemo, useState } from 'react';
import { Film, ImageIcon, Loader2, Upload } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

// Unified media control for the CMS: image → crop (aspect per preset) + Sharp
// optimization + preview; video → upload + preview; plus a manual URL field.
// Reuses ImageCropperModal (the single crop implementation shared with the
// fleet/marketing CroppedImageUploader).

type Props = {
  value?: string;
  onChange: (url: string) => void;
  preset?: string;       // /api/upload preset (hero, gallery, social-*, ...)
  aspect?: number;       // overrides the preset aspect
  crop?: boolean;        // false = optimize without cropping (e.g. logos)
  allowVideo?: boolean;  // show a video upload button
  buttonLabel?: string;
};

const presetAspect: Record<string, number> = {
  hero: 16 / 9,
  fleet: 16 / 10,
  gallery: 3 / 2,
  'social-square': 1,
  'social-story': 9 / 16,
  'social-landscape': 1200 / 630,
  default: 4 / 3,
};

export default function MediaField({
  value,
  onChange,
  preset = 'gallery',
  aspect,
  crop = true,
  allowVideo = false,
  buttonLabel = 'Фото',
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const resolvedAspect = useMemo(() => aspect || presetAspect[preset] || 4 / 3, [aspect, preset]);
  const isVideo = Boolean(value && (value.includes('.mp4') || value.includes('.webm')));

  const upload = async (blob: Blob, name: string, type: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', blob, name);
      fd.append('preset', type);
      fd.append('type', type);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) onChange(data.url);
      else alert(data.error || 'Не вдалося завантажити файл.');
    } catch {
      alert('Не вдалося завантажити файл.');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!crop) {
      upload(file, file.name, preset);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result?.toString() || null);
      setCropOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const pickVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) upload(file, file.name, 'default');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#080818] text-[#64646d]">
          {value ? (
            isVideo ? <video src={value} muted className="h-full w-full object-cover" /> : <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={18} />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Завантаження...' : buttonLabel}
            <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
          </label>
          {allowVideo && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
              <Film size={16} /> Відео
              <input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />
            </label>
          )}
        </div>
      </div>
      <input
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="або встав URL вручну"
        className="w-full rounded-lg border border-white/10 bg-[#080818] px-3 py-2 text-xs text-[#c7c6ca] outline-none placeholder:text-[#56565f] focus:border-[#e9c349]/60"
      />
      {imageSrc && (
        <ImageCropperModal
          imageSrc={imageSrc}
          isOpen={cropOpen}
          aspect={resolvedAspect}
          title={`Кадрування: ${buttonLabel}`}
          onClose={() => { setCropOpen(false); setImageSrc(null); }}
          onCropComplete={async (blob: Blob) => { setCropOpen(false); setImageSrc(null); await upload(blob, 'cropped.jpg', preset); }}
        />
      )}
    </div>
  );
}
