import { describe, expect, it } from "vitest";
import { parseFishIdentification } from "./schema";

describe("parseFishIdentification", () => {
  it("validates and sorts Gemini candidates", () => {
    const result = parseFishIdentification({
      isFish: true,
      imageQuality: "fair",
      warning: null,
      candidates: [
        { japaneseName: "候補B", scientificName: null, confidence: 0.2, reason: "理由" },
        { japaneseName: "候補A", scientificName: "Example fish", confidence: 0.8, reason: "理由" }
      ]
    });

    expect(result.candidates[0]?.japaneseName).toBe("候補A");
    expect(result.candidates).toHaveLength(2);
  });

  it("rejects invalid confidence values", () => {
    expect(() =>
      parseFishIdentification({
        isFish: true,
        imageQuality: "good",
        warning: null,
        candidates: [{ japaneseName: "魚", scientificName: null, confidence: 2, reason: "理由" }]
      })
    ).toThrow();
  });
});
