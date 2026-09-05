import { isGeminiMockMode } from "@/lib/env";
import type { DiveMetadata } from "@/types/fish";
import { parseFishIdentification, type FishIdentificationOutput } from "./schema";

type IdentifyFishParams = {
  imageBuffer: Buffer;
  mimeType: string;
  metadata: DiveMetadata;
};

const model = "gemini-3.7-flash";
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export async function identifyFishImage({
  imageBuffer,
  mimeType,
  metadata
}: IdentifyFishParams): Promise<FishIdentificationOutput> {
  if (isGeminiMockMode()) {
    return mockFishIdentification();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const metadataText = [
    metadata.locationName ? `撮影場所: ${metadata.locationName}` : null,
    metadata.encounteredAt ? `撮影日: ${metadata.encounteredAt}` : null,
    typeof metadata.depthM === "number" ? `水深: ${metadata.depthM}m` : null,
    typeof metadata.waterTemperatureC === "number" ? `水温: ${metadata.waterTemperatureC}℃` : null,
    metadata.memo ? `メモ: ${metadata.memo}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(geminiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["isFish", "candidates", "imageQuality", "warning"],
          properties: {
            isFish: { type: "BOOLEAN" },
            candidates: {
              type: "ARRAY",
              maxItems: 3,
              items: {
                type: "OBJECT",
                required: ["japaneseName", "scientificName", "confidence", "reason"],
                properties: {
                  japaneseName: { type: "STRING" },
                  scientificName: { type: "STRING", nullable: true },
                  confidence: { type: "NUMBER" },
                  reason: { type: "STRING" }
                }
              }
            },
            imageQuality: { type: "STRING", enum: ["good", "fair", "poor"] },
            warning: { type: "STRING", nullable: true }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const message = await geminiErrorMessage(response);
    throw new Error(message);
  }

  const json = (await response.json()) as GeminiGenerateContentResponse;
  const text = json.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseFishIdentification(JSON.parse(text));
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

async function geminiErrorMessage(response: Response) {
  const body = await response.text();
  if (response.status === 400) {
    return "Geminiへのリクエスト形式が正しくありません。モデル名や画像形式を確認してください。";
  }
  if (response.status === 401 || response.status === 403) {
    return "Gemini APIキーが無効、または権限がありません。Google AI StudioのAPIキーを確認してください。";
  }
  if (response.status === 429) {
    return "Gemini APIの利用上限に達しました。時間をおいてもう一度試してください。";
  }
  if (response.status >= 500) {
    return "Gemini API側で一時的なエラーが発生しています。時間をおいてもう一度試してください。";
  }

  return `Gemini APIへの接続に失敗しました。status=${response.status} ${body.slice(0, 200)}`;
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
