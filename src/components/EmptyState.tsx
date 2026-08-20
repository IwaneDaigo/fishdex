import Link from "next/link";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-kelp/40 bg-white/70 p-8 text-center">
      <p className="text-lg font-black">まだ魚が登録されていません。</p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
        ダイビングで出会った魚を{"\n"}あなたの図鑑に登録してみましょう。
      </p>
      <Link className="mt-6 inline-flex rounded-full bg-coral px-5 py-3 font-bold text-white shadow-soft" href="/identify">
        最初の魚を登録する
      </Link>
    </div>
  );
}
