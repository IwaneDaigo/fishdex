import Link from "next/link";
import { Camera, Library } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return <SetupHome />;
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return <LandingHome />;
  }

  const [{ count: speciesCount }, { count: encounterCount }, { data: recent }] = await Promise.all([
    supabase.from("user_fish_dex").select("*", { count: "exact", head: true }),
    supabase.from("encounters").select("*", { count: "exact", head: true }),
    supabase
      .from("encounters")
      .select("id, encountered_at, created_at, fish_species_id(japanese_name, scientific_name)")
      .order("created_at", { ascending: false })
      .limit(3)
  ]);

  return (
    <div className="shell py-8">
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-sm font-black tracking-[0.16em] text-kelp">MY OCEAN COLLECTION</p>
          <h1 className="mt-3 text-4xl font-black text-abyss md:text-5xl">魚図鑑</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            ダイビングで実際に出会った魚だけが埋まっていく、あなた専用の魚図鑑です。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Summary label="発見魚種" value={`${speciesCount ?? 0}種類`} />
            <Summary label="総遭遇" value={`${encounterCount ?? 0}回`} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link className="flex items-center justify-center gap-2 rounded-full bg-coral px-5 py-4 font-black text-white shadow-soft" href="/identify">
              <Camera size={20} aria-hidden />
              魚を登録する
            </Link>
            <Link className="flex items-center justify-center gap-2 rounded-full bg-abyss px-5 py-4 font-black text-white shadow-soft" href="/dex">
              <Library size={20} aria-hidden />
              MY図鑑を見る
            </Link>
          </div>
        </div>
        <RecentFish items={recent ?? []} />
      </section>
    </div>
  );
}

function LandingHome() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">FISHDEX</p>
        <h1 className="mt-3 text-4xl font-black text-abyss md:text-5xl">魚図鑑</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          ポケモン図鑑のように、ダイビングで出会った魚を写真と一緒に集めるWebアプリです。
        </p>
        <Link className="mt-7 inline-flex rounded-full bg-coral px-6 py-4 font-black text-white shadow-soft" href="/login">
          はじめる
        </Link>
      </section>
    </div>
  );
}

function SetupHome() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">SETUP REQUIRED</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">魚図鑑 / FishDex</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Supabase環境変数を設定すると、ログイン、写真アップロード、MY図鑑が有効になります。
          `USE_GEMINI_MOCK=true` のままでもAI判定UIは開発できます。
        </p>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-soft">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-abyss">{value}</p>
    </div>
  );
}

function RecentFish({ items }: { items: unknown[] }) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="font-black text-abyss">最近登録した魚</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const row = item as {
            id?: string;
            encountered_at?: string | null;
            created_at?: string | null;
            fish_species_id?: { japanese_name?: string; scientific_name?: string | null } | null;
          };
          return (
            <div className="rounded-lg bg-foam p-4" key={row.id ?? index}>
              <p className="font-black text-abyss">{row.fish_species_id?.japanese_name ?? "魚種名未設定"}</p>
              <p className="mt-1 text-sm italic text-slate-500">{row.fish_species_id?.scientific_name ?? "学名未確認"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
