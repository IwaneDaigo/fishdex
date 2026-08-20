import { z } from "zod";

export const fishCandidateSchema = z.object({
  japaneseName: z.string().trim().min(1).max(80),
  scientificName: z.string().trim().min(1).max(120).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(240)
});

export const fishIdentificationSchema = z.object({
  isFish: z.boolean(),
  candidates: z.array(fishCandidateSchema).max(3),
  imageQuality: z.enum(["good", "fair", "poor"]),
  warning: z.string().trim().max(240).nullable()
});

export type FishIdentificationOutput = z.infer<typeof fishIdentificationSchema>;

export function parseFishIdentification(input: unknown): FishIdentificationOutput {
  const parsed = fishIdentificationSchema.parse(input);
  return {
    ...parsed,
    candidates: parsed.candidates
      .map((candidate) => ({
        ...candidate,
        confidence: Math.max(0, Math.min(1, candidate.confidence))
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  };
}
