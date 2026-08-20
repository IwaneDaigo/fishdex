import { Type } from "@google/genai";
import { isGeminiMockMode } from "@/lib/env";
import type { DiveMetadata } from "@/types/fish";
import { createGeminiClient } from "./client";
import { parseFishIdentification, type FishIdentificationOutput } from "./schema";

type IdentifyFishParams = {
  imageBuffer: Buffer;
  mimeType: string;
  metadata: DiveMetadata;
};

const model = "gemini-3.7-flash";

export async function identifyFishImage({
  imageBuffer,
  mimeType,
  metadata
}: IdentifyFishParams): Promise<FishIdentificationOutput> {
  if (isGeminiMockMode()) {
    return mockFishIdentification();
  }

  const ai = createGeminiClient();
  const metadataText = [
    metadata.locationName ? `撮影場所: ${metadata.locationName}` : null,
    metadata.encounteredAt ? `撮影日: ${metadata.encounteredAt}` : null,
    typeof metadata.depthM === "number" ? `水深: ${metadata.depthM}m` : null,
    typeof metadata.waterTemperatureC === "number" ? `水温: ${metadata.waterTemperatureC}℃` : null,
    metadata.memo ? `メモ: ${metadata.memo}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `あなたは水中生物・魚類識別を支援するAIです。写真に写っている主な魚を識別してください。色、模様、体型、ヒレ、目、尾、地域、水深、生息環境を総合的に考慮し、確信がない場合は低いconfidenceにしてください。魚が確認できない場合はisFishをfalseにしてください。\n\n${metadataText || "追加の撮影情報はありません。"}`
          },
          {
            inlineData: {
              mimeType,
              data: imageBuffer.toString("base64")
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["isFish", "candidates", "imageQuality", "warning"],
        properties: {
          isFish: { type: Type.BOOLEAN },
          candidates: {
            type: Type.ARRAY,
            maxItems: 3,
            items: {
              type: Type.OBJECT,
              required: ["japaneseName", "scientificName", "confidence", "reason"],
              properties: {
                japaneseName: { type: Type.STRING },
                scientificName: { type: Type.STRING, nullable: true },
                confidence: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              }
            }
          },
          imageQuality: { type: Type.STRING, enum: ["good", "fair", "poor"] },
          warning: { type: Type.STRING, nullable: true }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseFishIdentification(JSON.parse(response.text));
}

function mockFishIdentification(): FishIdentificationOutput {
  return parseFishIdentification({
    isFish: true,
    imageQuality: "good",
    warning: null,
    candidates: [
      {
        japaneseName: "カクレクマノミ",
        scientificName: "Amphiprion ocellaris",
        confidence: 0.91,
        reason: "橙色の体色と白い帯の配置がよく一致しています。"
      },
      {
        japaneseName: "ハマクマノミ",
        scientificName: "Amphiprion frenatus",
        confidence: 0.06,
        reason: "体色は近いものの、白帯の数に違いがあります。"
      },
      {
        japaneseName: "クラウンアネモネフィッシュ",
        scientificName: "Amphiprion percula",
        confidence: 0.03,
        reason: "近縁種ですが、模様の縁取りが写真とやや異なります。"
      }
    ]
  });
}
