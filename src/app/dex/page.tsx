import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FishCard, type FishCardProps } from "@/components/FishCard";
import { isSupabaseConfigured } from "@/lib/env";
import { toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string }>;

export default async function DexPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isSupabaseConfigured()) {
    return <SetupMessage />;
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return <LoginRequired />;
  }

  const { q = "" } = await searchParams;
  const { data, error } = await supabase
    .from("user_fish_dex")
    .select(
      "fish_species_id, first_encounter_id, encounter_count, created_at, fish_species:fish_species_id(id, japanese_name, scientific_name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="shell py-10">
        <ErrorState message={toUserMessage(error, "MY図鑑を取得できませんでした。")} />
      </div>
    );
  }

  const firstEncounterIds = (data ?? [])
    .map((item) => {
      const row = item as { first_encounter_id?: string | null };
      return row.first_encounter_id ?? null;
    })
    .filter((id): id is string => Boolean(id));

  const firstEncounterById = await fetchFirstEncounters(supabase, firstEncounterIds);

  const cards = await Promise.all(
    (data ?? [])
      .map((item) => mapDexRow(item, firstEncounterById))
      .filter((item): item is Omit<FishCardProps, "imageUrl"> & { photoPath: string | null } => Boolean(item))
      .filter((item) => {
        const needle = q.trim().toLowerCase();
        if (!needle) return true;
        return `${item.japaneseName} ${item.scientificName ?? ""}`.toLowerCase().includes(needle);
      })
      .map(async (item) => ({
        ...item,
        imageUrl: item.photoPath ? await signedPhotoUrl(supabase, item.photoPath) : null
      }))
  );

  const totalEncounters = cards.reduce((sum, card) => sum + card.encounterCount, 0);

  return (
    <div className="shell py-8">
      <section>
        <p className="text-sm font-black tracking-[0.16em] text-kelp">MY FISH DEX</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">MY魚図鑑</h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Summary label="発見魚種" value={`${cards.length}種類`} />
          <Summary label="総遭遇" value={`${totalEncounters}回`} />
        </div>
        <form className="mt-5">
          <input
            name="q"
            defaultValue={q}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 shadow-soft"
            placeholder="和名・学名で検索"
          />
        </form>
        {cards.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <FishCard key={card.speciesId} {...card} />
            ))}
          </div>
        )}
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

function LoginRequired() {
  return (
    <div className="shell py-10">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-soft">
        <p className="font-black text-abyss">MY図鑑を見るにはログインしてください。</p>
        <Link className="mt-5 inline-flex rounded-full bg-coral px-5 py-3 font-bold text-white" href="/login">
          ログインへ
        </Link>
      </div>
    </div>
  );
}

function SetupMessage() {
  return (
    <div className="shell py-10">
      <div className="rounded-lg bg-white p-6 shadow-soft">Supabase環境変数を設定してください。</div>
    </div>
  );
}

function mapDexRow(item: unknown, firstEncounterById: Map<string, FirstEncounter>) {
  const row = item as {
    encounter_count?: number;
    created_at?: string | null;
    first_encounter_id?: string | null;
    fish_species?: RelatedSpecies;
  };

  const relatedSpecies = firstRelated(row.fish_species);
  if (!relatedSpecies?.id || !relatedSpecies.japanese_name) {
    return null;
  }

  const firstEncounter = row.first_encounter_id ? firstEncounterById.get(row.first_encounter_id) : null;

  return {
    speciesId: relatedSpecies.id,
    japaneseName: relatedSpecies.japanese_name,
    scientificName: relatedSpecies.scientific_name ?? null,
    firstEncounteredAt: firstEncounter?.encountered_at ?? firstEncounter?.created_at ?? row.created_at ?? null,
    encounterCount: row.encounter_count ?? 0,
    photoPath: firstEncounter?.photo_path ?? null
  };
}

async function fetchFirstEncounters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  firstEncounterIds: string[]
) {
  if (firstEncounterIds.length === 0) {
    return new Map<string, FirstEncounter>();
  }

  const { data } = await supabase
    .from("encounters")
    .select("id, photo_path, encountered_at, created_at")
    .in("id", firstEncounterIds);

  return new Map(
    (data ?? [])
      .map((item) => {
        const row = item as FirstEncounter;
        return row.id ? [row.id, row] : null;
      })
      .filter((entry): entry is [string, FirstEncounter] => Boolean(entry))
  );
}

type RelatedSpecies =
  | {
      id?: string;
      japanese_name?: string;
      scientific_name?: string | null;
    }
  | Array<{
      id?: string;
      japanese_name?: string;
      scientific_name?: string | null;
    }>
  | undefined
  | null;

function firstRelated(value: RelatedSpecies) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type FirstEncounter = {
  id?: string;
  photo_path?: string | null;
  encountered_at?: string | null;
  created_at?: string | null;
};

async function signedPhotoUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  const { data } = await supabase.storage.from("encounter-photos").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
