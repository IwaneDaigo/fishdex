export type DexStateResult = {
  encounterCount: number;
  isNewSpecies: boolean;
};

export function nextDexState(existingEncounterCount: number | null): DexStateResult {
  if (existingEncounterCount === null) {
    return { encounterCount: 1, isNewSpecies: true };
  }

  return { encounterCount: existingEncounterCount + 1, isNewSpecies: false };
}

export type SpeciesRecord = {
  id: string;
  japaneseName: string;
  scientificName: string | null;
};

export function resolveSpeciesRecord(records: SpeciesRecord[], japaneseName: string, scientificName: string | null) {
  const normalizedScientificName = scientificName?.trim().toLowerCase() ?? null;
  if (normalizedScientificName) {
    return records.find((record) => record.scientificName?.trim().toLowerCase() === normalizedScientificName) ?? null;
  }

  return (
    records.find(
      (record) =>
        record.scientificName === null &&
        record.japaneseName.trim().toLowerCase() === japaneseName.trim().toLowerCase()
    ) ?? null
  );
}
