import Image from "next/image";

export type EncounterCardProps = {
  imageUrl: string | null;
  locationName: string | null;
  encounteredAt: string | null;
  depthM: number | null;
  waterTemperatureC: number | null;
  memo: string | null;
};

export function EncounterCard(props: EncounterCardProps) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-soft">
      <div className="relative aspect-[4/3] bg-slate-200">
        {props.imageUrl ? (
          <Image src={props.imageUrl} alt="遭遇写真" fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-slate-500">No Photo</div>
        )}
      </div>
      <div className="space-y-2 p-4 text-sm text-slate-600">
        <p className="font-bold text-abyss">{formatDate(props.encounteredAt)}</p>
        <p>{props.locationName ?? "場所未入力"}</p>
        <p>
          水深 {props.depthM ?? "-"}m / 水温 {props.waterTemperatureC ?? "-"}℃
        </p>
        {props.memo ? <p className="leading-6">{props.memo}</p> : null}
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "撮影日未入力";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}
