import { z } from "zod";
import { toUserMessage } from "@/lib/errors";
import { normalizeJapaneseName, normalizeScientificName } from "@/lib/fish/normalize";
import type { DiveMetadata, RegistrationResult } from "@/types/fish";

export const registerEncounterInputSchema = z.object({
  photoPath: z.string().min(1),
  japaneseName: z.string().trim().min(1).max(80),
  scientificName: z.string().trim().max(120).nullable(),
  aiConfidence: z.number().min(0).max(1).nullable(),
  aiRawResult: z.unknown().nullable(),
  metadata: z.object({
    locationName: z.string().trim().max(120).optional(),
    encounteredAt: z.string().trim().max(40).optional(),
    depthM: z.number().min(0).max(200).optional(),
    waterTemperatureC: z.number().min(-5).max(45).optional(),
    memo: z.string().trim().max(1000).optional()
  })
});

export type RegisterEncounterInput = z.infer<typeof registerEncounterInputSchema>;

type RpcClient = {
  rpc: (
    functionName: "register_fish_encounter",
    args: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const registrationResultSchema = z.object({
  species_id: z.string().uuid(),
  encounter_id: z.string().uuid(),
  japanese_name: z.string(),
  scientific_name: z.string().nullable(),
  encounter_count: z.number().int(),
  is_new_species: z.boolean()
});

const rpcRegistrationResultSchema = z.union([
  registrationResultSchema,
  z.array(registrationResultSchema).min(1).transform((items) => items[0])
]);

export async function registerEncounter(
  supabase: RpcClient,
  userId: string,
  input: RegisterEncounterInput
): Promise<RegistrationResult> {
  const parsed = registerEncounterInputSchema.parse(input);
  const metadata: DiveMetadata = parsed.metadata;

  const { data, error } = await supabase.rpc("register_fish_encounter", {
    p_user_id: userId,
    p_photo_path: parsed.photoPath,
    p_japanese_name: normalizeJapaneseName(parsed.japaneseName),
    p_scientific_name: normalizeScientificName(parsed.scientificName),
    p_location_name: metadata.locationName || null,
    p_depth_m: metadata.depthM ?? null,
    p_water_temperature_c: metadata.waterTemperatureC ?? null,
    p_encountered_at: metadata.encounteredAt || null,
    p_memo: metadata.memo || null,
    p_ai_confidence: parsed.aiConfidence,
    p_ai_raw_result: parsed.aiRawResult
  });

  if (error) {
    throw new Error(toUserMessage(error, "図鑑への登録に失敗しました。"));
  }

  const result = rpcRegistrationResultSchema.parse(data);
  return {
    speciesId: result.species_id,
    encounterId: result.encounter_id,
    japaneseName: result.japanese_name,
    scientificName: result.scientific_name,
    encounterCount: result.encounter_count,
    isNewSpecies: result.is_new_species
  };
}
