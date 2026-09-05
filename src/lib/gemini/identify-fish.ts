import { isGeminiMockMode } from "@/lib/env";
import type { DiveMetadata } from "@/types/fish";
import { parseFishIdentification, type FishIdentificationOutput } from "./schema";

type IdentifyFishParams = {
  imageBuffer: Buffer;
  mimeType: string;
  metadata: DiveMetadata;
};

const model = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const maxAttempts = 3;

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

  const requestBody = {
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
      temperature: 0.2,
      maxOutputTokens: 900,
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
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await geminiError(response);
        if (isRetryableGeminiError(error) && attempt < maxAttempts) {
          await wait(geminiRetryDelayMs(error, attempt));
          continue;
        }
        if (isRetryableGeminiError(error)) {
          return fallbackFishIdentification();
        }

        throw new Error(error.message);
      }

      const json = (await response.json()) as GeminiGenerateContentResponse;
      const text = json.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      return parseFishIdentification(JSON.parse(text));
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxAttempts) {
        await wait(geminiRetryDelayMs(null, attempt));
        continue;
      }

      if (isRetryableNetworkError(error)) {
        return fallbackFishIdentification();
      }

      throw error;
    }
  }

  return fallbackFishIdentification();
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

type GeminiApiError = {
  status: number;
  message: string;
  retryAfterMs: number | null;
};

async function geminiError(response: Response): Promise<GeminiApiError> {
  const body = await response.text();
  const retryAfterMs = retryAfterHeaderMs(response.headers.get("retry-after"));
  if (response.status === 400) {
    return {
      status: response.status,
      message: "Geminiへのリクエスト形式が正しくありません。モデル名や画像形式を確認してください。",
      retryAfterMs
    };
  }
  if (response.status === 401 || response.status === 403) {
    return {
      status: response.status,
      message: "Gemini APIキーが無効、または権限がありません。Google AI StudioのAPIキーを確認してください。",
      retryAfterMs
    };
  }
  if (response.status === 429) {
    return {
      status: response.status,
      message: "Gemini APIの利用上限に達しました。時間をおいてもう一度試してください。",
      retryAfterMs
    };
  }
  if (response.status >= 500) {
    return {
      status: response.status,
      message: "Gemini API側で一時的なエラーが発生しています。時間をおいてもう一度試してください。",
      retryAfterMs
    };
  }

  return {
    status: response.status,
    message: `Gemini APIへの接続に失敗しました。status=${response.status} ${body.slice(0, 200)}`,
    retryAfterMs
  };
}

function isRetryableGeminiError(error: GeminiApiError) {
  return error.status === 429 || error.status >= 500;
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("fetch failed") || message.includes("network") || message.includes("timeout");
}

function geminiRetryDelayMs(error: GeminiApiError | null, attempt: number) {
  if (error?.retryAfterMs) {
    return Math.min(error.retryAfterMs, 5000);
  }

  return 800 * 2 ** (attempt - 1);
}

function retryAfterHeaderMs(value: string | null) {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fallbackFishIdentification(): FishIdentificationOutput {
  return parseFishIdentification({
    isFish: true,
    imageQuality: "poor",
    warning: "Geminiの利用上限または一時的な混雑によりAI判定を完了できませんでした。写真は保存済みです。候補を手入力して登録できます。",
    candidates: [
      {
        japaneseName: "魚種未確認",
        scientificName: null,
        confidence: 0,
        reason: "AI判定が一時的に利用できないため、和名を確認して修正してください。"
      }
    ]
  });
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
