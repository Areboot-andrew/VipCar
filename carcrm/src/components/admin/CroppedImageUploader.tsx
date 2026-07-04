"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";

export type UploadPreset =
  | "fleet"
  | "gallery"
  | "hero"
  | "social-square"
  | "social-story"
  | "social-landscape";

type UploadResult = {
  url: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  originalName: string;
  width?: number;
  height?: number;
  size?: number;
  preset?: string;
};

type Props = {
  label?: string;
  buttonLabel?: string;
  value?: string;
  preset?: UploadPreset;
  aspect?: number;
  disabled?: boolean;
  className?: string;
  onUploaded: (result: UploadResult) => void;
};

const presetAspect: Record<UploadPreset, number> = {
  fleet: 16 / 10,
  gallery: 3 / 2,
  hero: 16 / 9,
  "social-square": 1,
  "social-story": 9 / 16,
  "social-landscape": 1200 / 630,
};

export default function CroppedImageUploader({
  label,
  buttonLabel = "Фото",
  value,
  preset = "fleet",
  aspect,
  disabled = false,
  className = "",
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const resolvedAspect = useMemo(() => aspect || presetAspect[preset] || 4 / 3, [aspect, preset]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || null);
      setCropOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropOpen(false);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", croppedBlob, "cropped.jpg");
    formData.append("preset", preset);
    formData.append("type", preset);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      onUploaded(data);
    } catch (error) {
      console.error(error);
      alert("Не вдалося завантажити фото.");
    } finally {
      setUploading(false);
      setImageSrc(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a8a93]">{label}</div>}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#080818]">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#080818] text-[#64646d]">
            <ImageIcon size={18} />
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Завантаження..." : buttonLabel}
          <input type="file" accept="image/*" className="hidden" disabled={disabled || uploading} onChange={handleFileSelect} />
        </label>
      </div>

      {imageSrc && (
        <ImageCropperModal
          imageSrc={imageSrc}
          isOpen={cropOpen}
          aspect={resolvedAspect}
          title={`Кадрування: ${buttonLabel}`}
          onClose={() => {
            setCropOpen(false);
            setImageSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
