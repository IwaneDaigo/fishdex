"use client";

import Image from "next/image";
import { Camera } from "lucide-react";

type Props = {
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
};

export function ImageUploader({ previewUrl, onFileChange }: Props) {
  return (
    <label className="focus-within:ring-2 focus-within:ring-kelp block cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-kelp/40 bg-white">
      <input
        className="sr-only"
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        required
      />
      <div className="relative aspect-[4/3]">
        {previewUrl ? (
          <Image src={previewUrl} alt="選択した魚写真" fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <Camera className="mx-auto text-kelp" size={40} aria-hidden />
              <p className="mt-3 font-black text-abyss">魚の写真を選択</p>
              <p className="mt-2 text-sm text-slate-500">JPEG / PNG / WebP、8MBまで</p>
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
