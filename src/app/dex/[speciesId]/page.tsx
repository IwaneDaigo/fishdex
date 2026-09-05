import Link from "next/link";
import { EncounterCard } from "@/components/EncounterCard";
import { ErrorState } from "@/components/ErrorState";
import { isSupabaseConfigured } from "@/lib/env";
import { toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ speciesId: string }>;

export default async function SpeciesDetailPage({ params }: { params: Params }) {
  if (!isSupabaseConfigured()) {
    return <div className="shell py-10">Supabase環境変数を設定してください。</div>;
  }

  const { speciesId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <div className="shell py-10">
        <Link className="rounded-full bg-coral px-5 py-3 font-bold text-white" href="/login">
          ログインへ
        </Link>
      </div>
    );
  }

  const [
    { data: dex, error: dexError },
    { data: encounters, error: encountersError },
    { data: speciesById, error: speciesError }
  ] = await Promise.all([
    supabase
      .from("user_fish_dex")
      .select("encounter_count, created_at, fish_species:fish_species_id(id, japanese_name, scientific_name)")
      .eq("fish_species_id", speciesId)
      .maybeSingle(),
    supabase
      .from("encounters")
      .select("id, photo_path, location_name, depth_m, water_temperature_c, encountered_at, memo, created_at, fish_species:fish_species_id(japanese_name, scientific_name)")
      .eq("fish_species_id", speciesId)
      .order("created_at", { ascending: false }),
    supabase
      .from("fish_species")
      .select("japanese_name, scientific_name")
      .eq("id", speciesId)
      .maybeSingle()
  ]);

  const queryError = dexError ?? encountersError ?? speciesError;
  if (queryError) {
    return (
      <div className="shell py-10">
        <ErrorState message={toUserMessage(queryError, "魚の詳細を取得できませんでした。")} />
        <Link className="mt-5 inline-flex rounded-full bg-abyss px-5 py-3 font-bold text-white" href="/dex">
          MY図鑑へ戻る
        </Link>
      </div>
    );
  }

  const encounterRows = encounters ?? [];
  const species = mapSpecies(dex) ?? mapSpeciesFromEncounter(encounterRows[0], encounterRows.length) ?? mapSpeciesById(speciesById);
  if (!species) {
    return (
      <div className="shell py-10">
        <ErrorState message="この魚の詳細データが見つかりませんでした。登録が完了していないか、別のアカウントの記録の可能性があります。" />
        <Link className="mt-5 inline-flex rounded-full bg-abyss px-5 py-3 font-bold text-white" href="/dex">
          MY図鑑へ戻る
        </Link>
      </div>
    );
  }

  const encounterCards = await Promise.all(
    encounterRows.map(async (encounter) => {
      const row = encounter as {
        id?: string;
        photo_path?: string | null;
        location_name?: string | null;
        depth_m?: number | null;
        water_temperature_c?: number | null;
        encountered_at?: string | null;
        memo?: string | null;
      };
      return {
        id: row.id ?? crypto.randomUUID(),
        imageUrl: row.photo_path ? await signedPhotoUrl(supabase, row.photo_path) : null,
        locationName: row.location_name ?? null,
        encounteredAt: row.encountered_at ?? null,
        depthM: row.depth_m ?? null,
        waterTemperatureC: row.water_temperature_c ?? null,
        memo: row.memo ?? null
      };
    })
  );

  return (
    <div className="shell py-8">
      <Link href="/dex" className="text-sm font-bold text-kelp">
        MY図鑑へ戻る
      </Link>
      <section className="mt-5 rounded-lg bg-white p-5 shadow-soft">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">SPECIES DETAIL</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">{species.japaneseName}</h1>
        <p className="mt-1 text-sm italic text-slate-500">{species.scientificName ?? "学名未確認"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Summary label="初発見日" value={formatDate(species.firstEncounteredAt)} />
          <Summary label="遭遇回数" value={`${species.encounterCount}回`} />
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-black text-abyss">過去の遭遇記録</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {encounterCards.map((encounter) => (
            <EncounterCard key={encounter.id} {...encounter} />
          ))}
        </div>
      </section>
    </div>
  );
}

function mapSpecies(item: unknown) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const row = item as {
    encounter_count?: number;
    fish_species?: RelatedSpecies;
    created_at?: string | null;
  };
  const relatedSpecies = firstRelated(row.fish_species);
  if (!relatedSpecies?.japanese_name) return null;
  return {
    japaneseName: relatedSpecies.japanese_name,
    scientificName: relatedSpecies.scientific_name ?? null,
    encounterCount: row.encounter_count ?? 0,
    firstEncounteredAt: row.created_at ?? null
  };
}

function mapSpeciesFromEncounter(item: unknown, encounterCount: number) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const row = item as {
    encountered_at?: string | null;
    created_at?: string | null;
    fish_species?: RelatedSpecies;
  };
  const relatedSpecies = firstRelated(row.fish_species);
  if (!relatedSpecies?.japanese_name) return null;

  return {
    japaneseName: relatedSpecies.japanese_name,
    scientificName: relatedSpecies.scientific_name ?? null,
    encounterCount,
    firstEncounteredAt: row.encountered_at ?? row.created_at ?? null
  };
}

function mapSpeciesById(item: unknown) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const row = item as {
    japanese_name?: string;
    scientific_name?: string | null;
  };
  if (!row.japanese_name) return null;

  return {
    japaneseName: row.japanese_name,
    scientificName: row.scientific_name ?? null,
    encounterCount: 0,
    firstEncounteredAt: null
  };
}

type RelatedSpecies =
  | {
      japanese_name?: string;
      scientific_name?: string | null;
    }
  | Array<{
      japanese_name?: string;
      scientific_name?: string | null;
    }>
  | undefined
  | null;

function firstRelated(value: RelatedSpecies) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-foam p-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-abyss">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "未入力";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}

async function signedPhotoUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  const { data } = await supabase.storage.from("encounter-photos").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
