import Link from "next/link";
import { DeleteFishButton } from "@/components/DeleteFishButton";

export type FishCardProps = {
  speciesId: string;
  japaneseName: string;
  scientificName: string | null;
  firstEncounteredAt: string | null;
  encounterCount: number;
  imageUrl: string | null;
  canDelete?: boolean;
};

export function FishCard(props: FishCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-soft transition hover:-translate-y-0.5">
      <Link href={`/dex/${props.speciesId}`}>
        <div className="relative aspect-[4/3] bg-slate-200">
          {props.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.imageUrl} alt={props.japaneseName} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm font-bold text-slate-500">No Photo</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/dex/${props.speciesId}`}>
          <h3 className="font-black text-abyss">{props.japaneseName}</h3>
          <p className="mt-1 min-h-5 text-sm italic text-slate-500">{props.scientificName ?? "学名未確認"}</p>
        </Link>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>初発見 {formatDate(props.firstEncounteredAt)}</span>
          <span className="rounded-full bg-reef/30 px-3 py-1">遭遇 {props.encounterCount}回</span>
        </div>
        {props.canDelete ? (
          <div className="mt-4 flex justify-end">
            <DeleteFishButton speciesId={props.speciesId} japaneseName={props.japaneseName} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "未入力";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}
