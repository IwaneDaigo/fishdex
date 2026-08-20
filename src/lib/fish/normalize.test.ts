import { describe, expect, it } from "vitest";
import { normalizeCandidate, normalizeScientificName } from "./normalize";

describe("fish normalization", () => {
  it("normalizes scientific names", () => {
    expect(normalizeScientificName("  Amphiprion   ocellaris ")).toBe("Amphiprion ocellaris");
    expect(normalizeScientificName(" ")).toBeNull();
  });

  it("clamps candidate confidence", () => {
    expect(
      normalizeCandidate({
        japaneseName: " カクレクマノミ ",
        scientificName: " Amphiprion ocellaris ",
        confidence: -1,
        reason: " 理由 "
      })
    ).toEqual({
      japaneseName: "カクレクマノミ",
      scientificName: "Amphiprion ocellaris",
      confidence: 0,
      reason: "理由"
    });
  });
});
