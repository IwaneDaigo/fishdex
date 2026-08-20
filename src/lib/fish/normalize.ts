import type { FishCandidate } from "@/types/fish";

export function normalizeScientificName(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function normalizeJapaneseName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCandidate(candidate: FishCandidate): FishCandidate {
  return {
    japaneseName: normalizeJapaneseName(candidate.japaneseName),
    scientificName: normalizeScientificName(candidate.scientificName),
    confidence: Math.max(0, Math.min(1, candidate.confidence)),
    reason: candidate.reason.trim()
  };
}
