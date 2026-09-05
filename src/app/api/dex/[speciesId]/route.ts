import { NextResponse } from "next/server";
import { z } from "zod";
import { toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ speciesId: string }>;

const paramsSchema = z.object({
  speciesId: z.string().uuid()
});

export async function DELETE(_request: Request, { params }: { params: Params }) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    }

    const { speciesId } = paramsSchema.parse(await params);
    const { data: encounters, error: encountersError } = await supabase
      .from("encounters")
      .select("id, photo_path")
      .eq("user_id", user.id)
      .eq("fish_species_id", speciesId);

    if (encountersError) {
      return NextResponse.json(
        { error: toUserMessage(encountersError, "削除対象の遭遇記録を取得できませんでした。") },
        { status: 500 }
      );
    }

    const { error: dexDeleteError } = await supabase
      .from("user_fish_dex")
      .delete()
      .eq("user_id", user.id)
      .eq("fish_species_id", speciesId);

    if (dexDeleteError) {
      return NextResponse.json(
        { error: toUserMessage(dexDeleteError, "MY図鑑から削除できませんでした。") },
        { status: 500 }
      );
    }

    const { error: encountersDeleteError } = await supabase
      .from("encounters")
      .delete()
      .eq("user_id", user.id)
      .eq("fish_species_id", speciesId);

    if (encountersDeleteError) {
      return NextResponse.json(
        { error: toUserMessage(encountersDeleteError, "遭遇記録を削除できませんでした。") },
        { status: 500 }
      );
    }

    const photoPaths = (encounters ?? [])
      .map((encounter) => {
        const row = encounter as { photo_path?: string | null };
        return row.photo_path ?? null;
      })
      .filter((path): path is string => Boolean(path));

    if (photoPaths.length > 0) {
      await supabase.storage.from("encounter-photos").remove(photoPaths);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error, "MY図鑑から削除できませんでした。") }, { status: 500 });
  }
}
