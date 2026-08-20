import type { FishCandidate } from "@/types/fish";

type Props = {
  candidate: FishCandidate;
  selected: boolean;
  onSelect: () => void;
};

export function IdentificationCandidate({ candidate, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`focus-ring w-full rounded-lg border p-4 text-left transition ${
        selected ? "border-coral bg-coral/10" : "border-slate-200 bg-white hover:border-kelp"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-abyss">{candidate.japaneseName}</p>
          <p className="mt-1 text-sm italic text-slate-500">{candidate.scientificName ?? "学名未確認"}</p>
        </div>
        <span className="shrink-0 rounded-full bg-abyss px-3 py-1 text-xs font-bold text-white">
          目安 {Math.round(candidate.confidence * 100)}%
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{candidate.reason}</p>
    </button>
  );
}
