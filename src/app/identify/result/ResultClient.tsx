"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IdentificationCandidate } from "@/components/IdentificationCandidate";
import { NewSpeciesModal } from "@/components/NewSpeciesModal";
import type { FishIdentification, RegistrationResult } from "@/types/fish";

type StoredResult = {
  identification: FishIdentification;
  photoPath: string;
  metadata: Record<string, unknown>;
};

export function ResultClient() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const [japaneseName, setJapaneseName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<RegistrationResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("fishdex.identification");
    if (!raw) {
      router.replace("/identify");
      return;
    }
    const parsed = JSON.parse(raw) as StoredResult;
    // sessionStorage is the handoff between the upload page and this confirmation page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored(parsed);
    const firstCandidate = parsed.identification.candidates[0];
    if (firstCandidate) {
      setJapaneseName(firstCandidate.japaneseName);
      setScientificName(firstCandidate.scientificName ?? "");
    }
  }, [router]);

  const selectedCandidate = useMemo(() => stored?.identification.candidates[selectedIndex] ?? null, [stored, selectedIndex]);

  async function handleRegister() {
    if (!stored) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoPath: stored.photoPath,
          japaneseName,
          scientificName: scientificName.trim() || null,
          aiConfidence: selectedCandidate?.confidence ?? null,
          aiRawResult: stored.identification,
          metadata: stored.metadata
        })
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "登録に失敗しました。");
      }
      sessionStorage.removeItem("fishdex.identification");
      setRegistered(json as RegistrationResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  if (!stored) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-reef/30 p-4 text-sm font-bold leading-6 text-abyss">
        AIによる推定結果です。必ず確認してください。
        {stored.identification.warning ? <span className="block text-coral">{stored.identification.warning}</span> : null}
      </div>
      {!stored.identification.isFish ? (
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <p className="font-black text-coral">写真から魚を確認できませんでした。</p>
          <button className="mt-4 rounded-full bg-abyss px-5 py-3 font-bold text-white" onClick={() => router.push("/identify")}>
            写真を選び直す
          </button>
        </div>
      ) : null}
      <div className="space-y-3">
        {stored.identification.candidates.map((candidate, index) => (
          <IdentificationCandidate
            candidate={candidate}
            key={`${candidate.japaneseName}-${index}`}
            selected={!manual && selectedIndex === index}
            onSelect={() => {
              setManual(false);
              setSelectedIndex(index);
              setJapaneseName(candidate.japaneseName);
              setScientificName(candidate.scientificName ?? "");
            }}
          />
        ))}
        <button
          type="button"
          className={`focus-ring w-full rounded-lg border p-4 text-left font-bold ${manual ? "border-coral bg-coral/10" : "border-slate-200 bg-white"}`}
          onClick={() => setManual(true)}
        >
          候補にない / 自分で修正する
        </button>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-soft">
        <h2 className="font-black text-abyss">登録内容の確認</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            和名
            <input className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" value={japaneseName} onChange={(event) => setJapaneseName(event.target.value)} />
          </label>
          <label className="text-sm font-bold text-slate-700">
            学名
            <input className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" value={scientificName} onChange={(event) => setScientificName(event.target.value)} />
          </label>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-coral/10 p-3 text-sm font-bold text-coral">{error}</p> : null}
        <button
          className="mt-5 w-full rounded-full bg-coral px-5 py-4 font-black text-white shadow-soft disabled:opacity-60"
          disabled={loading || japaneseName.trim().length === 0}
          onClick={handleRegister}
        >
          {loading ? "登録中..." : "この魚として図鑑に登録"}
        </button>
      </div>
      {registered ? <NewSpeciesModal result={registered} /> : null}
    </div>
  );
}
