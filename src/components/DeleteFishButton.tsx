"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteFishButtonProps = {
  speciesId: string;
  japaneseName: string;
};

export function DeleteFishButton({ speciesId, japaneseName }: DeleteFishButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);

    const confirmed = window.confirm(
      `「${japaneseName}」をMY図鑑から削除します。過去の遭遇記録と写真も削除されます。よろしいですか？`
    );
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/dex/${speciesId}`, { method: "DELETE" });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "削除に失敗しました。");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-coral/30 bg-white text-coral transition hover:bg-coral hover:text-white disabled:cursor-wait disabled:opacity-60"
        title="MY図鑑から削除"
        aria-label={`${japaneseName}をMY図鑑から削除`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      {error ? <p className="max-w-full text-right text-xs font-bold text-coral">{error}</p> : null}
    </div>
  );
}
