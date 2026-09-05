import Link from "next/link";
import { Camera, Library } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return <SetupHome />;
  }

  return <LandingHome />;
}

function LandingHome() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-2xl text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uolog-logo.png" alt="魚ログ" className="mx-auto h-40 w-40 object-contain sm:h-52 sm:w-52" />
        <p className="text-sm font-black tracking-[0.16em] text-kelp">UOLOG</p>
        <h1 className="mt-3 text-4xl font-black text-abyss md:text-5xl">魚ログ</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          ポケモン図鑑のように、ダイビングで出会った魚を写真と一緒に記録するWebアプリです。
        </p>
        <Link className="mt-7 inline-flex rounded-full bg-coral px-6 py-4 font-black text-white shadow-soft" href="/login">
          はじめる
        </Link>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link className="flex items-center justify-center gap-2 rounded-full bg-coral px-5 py-4 font-black text-white shadow-soft" href="/identify">
            <Camera size={20} aria-hidden />
            魚を登録する
          </Link>
          <Link className="flex items-center justify-center gap-2 rounded-full bg-abyss px-5 py-4 font-black text-white shadow-soft" href="/dex">
            <Library size={20} aria-hidden />
            MY図鑑を見る
          </Link>
        </div>
      </section>
    </div>
  );
}

function SetupHome() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">SETUP REQUIRED</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">魚ログ</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Supabase環境変数を設定すると、ログイン、写真アップロード、MY図鑑が有効になります。
          `USE_GEMINI_MOCK=true` のままでもAI判定UIは開発できます。
        </p>
      </section>
    </div>
  );
}
