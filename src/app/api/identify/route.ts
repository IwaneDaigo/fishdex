import { NextResponse } from "next/server";
import { z } from "zod";
import { toUserMessage } from "@/lib/errors";
import { identifyFishImage } from "@/lib/gemini/identify-fish";
import { createClient } from "@/lib/supabase/server";
import { buildEncounterPhotoPath, validateImageFile } from "@/lib/supabase/storage";

const metadataSchema = z.object({
  locationName: z.string().trim().max(120).optional(),
  encounteredAt: z.string().trim().max(40).optional(),
  depthM: z.coerce.number().min(0).max(200).optional(),
  waterTemperatureC: z.coerce.number().min(-5).max(45).optional(),
  memo: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "写真を選択してください。" }, { status: 400 });
    }

    const { extension } = validateImageFile(photo);
    const metadata = metadataSchema.parse({
      locationName: stringOrUndefined(formData.get("locationName")),
      encounteredAt: stringOrUndefined(formData.get("encounteredAt")),
      depthM: stringOrUndefined(formData.get("depthM")),
      waterTemperatureC: stringOrUndefined(formData.get("waterTemperatureC")),
      memo: stringOrUndefined(formData.get("memo"))
    });

    const buffer = Buffer.from(await photo.arrayBuffer());
    const photoPath = buildEncounterPhotoPath(user.id, extension);
    const { error: uploadError } = await supabase.storage
      .from("encounter-photos")
      .upload(photoPath, buffer, { contentType: photo.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "写真のアップロードに失敗しました。" }, { status: 500 });
    }

    const identification = await identifyFishImage({
      imageBuffer: buffer,
      mimeType: photo.type,
      metadata
    });

    return NextResponse.json({ identification, photoPath, metadata });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error, "魚判定に失敗しました。") }, { status: 500 });
  }
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
