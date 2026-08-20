"use client";

import Link from "next/link";
import type { RegistrationResult } from "@/types/fish";

export function NewSpeciesModal({ result }: { result: RegistrationResult }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-abyss/70 p-4">
      <div className="surface-in w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-black tracking-[0.18em] text-coral">{result.isNewSpecies ? "NEW SPECIES!" : "再発見!"}</p>
        <h2 className="mt-3 text-2xl font-black text-abyss">{result.japaneseName}</h2>
        <p className="mt-2 text-sm italic text-slate-500">{result.scientificName ?? "学名未確認"}</p>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          {result.isNewSpecies
            ? "新しい魚を図鑑に登録しました!"
            : `遭遇回数が${result.encounterCount}回になりました。`}
        </p>
        <Link
          className="mt-6 inline-flex w-full justify-center rounded-full bg-abyss px-5 py-3 font-bold text-white"
          href={`/dex/${result.speciesId}`}
        >
          詳細を見る
        </Link>
      </div>
    </div>
  );
}
