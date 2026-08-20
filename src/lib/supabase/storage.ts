import { randomUUID } from "crypto";

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export const maxUploadBytes = 8 * 1024 * 1024;

export function validateImageFile(file: File) {
  const extension = allowedMimeTypes.get(file.type);
  if (!extension) {
    throw new Error("JPEG、PNG、WebP形式の写真を選択してください。");
  }

  if (file.size <= 0) {
    throw new Error("写真ファイルを選択してください。");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("写真は8MB以下にしてください。");
  }

  return { extension };
}

export function buildEncounterPhotoPath(userId: string, extension: string) {
  return `${userId}/${randomUUID()}.${extension}`;
}
