"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";
import { LoadingState } from "@/components/LoadingState";

export function IdentifyForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("写真を選択してください。");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("photo", file);
    setLoading(true);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "魚判定に失敗しました。");
      }

      sessionStorage.setItem("fishdex.identification", JSON.stringify(json));
      router.push("/identify/result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "魚判定に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ImageUploader previewUrl={previewUrl} onFileChange={handleFileChange} />
      <div className="grid gap-4 rounded-lg bg-white p-4 shadow-soft md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">
          撮影場所
          <input name="locationName" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" placeholder="沖縄県 慶良間諸島" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          撮影日
          <input name="encounteredAt" type="date" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          水深（m）
          <input name="depthM" type="number" min="0" step="0.1" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          水温（℃）
          <input name="waterTemperatureC" type="number" step="0.1" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
        </label>
        <label className="text-sm font-bold text-slate-700 md:col-span-2">
          メモ
          <textarea name="memo" rows={4} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
        </label>
      </div>
      {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm font-bold text-coral">{error}</p> : null}
      <button className="w-full rounded-full bg-coral px-5 py-4 text-base font-black text-white shadow-soft">AIで魚を判定</button>
    </form>
  );
}
