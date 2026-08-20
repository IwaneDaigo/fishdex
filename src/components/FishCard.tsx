import Image from "next/image";
import Link from "next/link";

export type FishCardProps = {
  speciesId: string;
  japaneseName: string;
  scientificName: string | null;
  firstEncounteredAt: string | null;
  encounterCount: number;
  imageUrl: string | null;
};

export function FishCard(props: FishCardProps) {
  return (
    <Link className="group overflow-hidden rounded-lg bg-white shadow-soft transition hover:-translate-y-0.5" href={`/dex/${props.speciesId}`}>
      <div className="relative aspect-[4/3] bg-slate-200">
        {props.imageUrl ? (
          <Image src={props.imageUrl} alt={props.japaneseName} fill className="object-cover" sizes="(max-width: 768px) 50vw, 280px" />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-slate-500">No Photo</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-black text-abyss">{props.japaneseName}</h3>
        <p className="mt-1 min-h-5 text-sm italic text-slate-500">{props.scientificName ?? "学名未確認"}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>初発見 {formatDate(props.firstEncounteredAt)}</span>
          <span className="rounded-full bg-reef/30 px-3 py-1">遭遇 {props.encounterCount}回</span>
        </div>
      </div>
    </Link>
  );
}

function formatDate(value: string | null) {
  if (!value) return "未入力";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}
