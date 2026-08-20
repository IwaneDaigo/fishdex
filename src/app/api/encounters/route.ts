import { NextResponse } from "next/server";
import { toUserMessage } from "@/lib/errors";
import { registerEncounter, registerEncounterInputSchema } from "@/lib/encounters/register";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    }

    const json = await request.json();
    const input = registerEncounterInputSchema.parse(json);
    const result = await registerEncounter(supabase, user.id, input);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error, "図鑑への登録に失敗しました。") }, { status: 500 });
  }
}
