import { describe, expect, it } from "vitest";
import { nextDexState, resolveSpeciesRecord } from "./dex-state";

describe("nextDexState", () => {
  it("marks first encounter as new species", () => {
    expect(nextDexState(null)).toEqual({ encounterCount: 1, isNewSpecies: true });
  });

  it("increments rediscovery count", () => {
    expect(nextDexState(2)).toEqual({ encounterCount: 3, isNewSpecies: false });
  });
});

describe("resolveSpeciesRecord", () => {
  it("reuses an existing scientific name case-insensitively", () => {
    const result = resolveSpeciesRecord(
      [{ id: "1", japaneseName: "カクレクマノミ", scientificName: "Amphiprion ocellaris" }],
      "別名",
      "amphiprion OCELLARIS"
    );
    expect(result?.id).toBe("1");
  });
});
