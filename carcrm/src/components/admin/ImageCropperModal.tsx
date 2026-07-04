"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, X } from "lucide-react";

type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };

type Props = {
  imageSrc: string;
  isOpen: boolean;
  aspect: number;
  title?: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
};

export default function ImageCropperModal({
  imageSrc,
  isOpen,
  aspect,
  title = "Кадрування фото",
  onClose,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const croppedImage = await getCroppedImage(imageSrc, croppedAreaPixels);
    onCropComplete(croppedImage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#13131a] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="m-0 text-lg font-black text-white">{title}</h3>
            <p className="m-0 mt-1 text-xs text-[#8a8a93]">Піджени кадр перед оптимізацією. Так фото нормально сяде в картку, галерею або соцмережу.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#c7c6ca] hover:bg-white/5 hover:text-white" aria-label="Закрити">
            <X size={20} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#101018] p-4">
          <div className="mb-4 flex items-center gap-4">
            <span className="w-16 text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a93]">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[#e9c349]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/5">
              Скасувати
            </button>
            <button type="button" onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-4 py-3 text-sm font-black text-black hover:bg-[#ffe175]">
              <Check size={18} />
              Обрізати і завантажити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas is not available");

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.92);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
