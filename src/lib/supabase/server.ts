import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the session cookies.
        }
      }
    }
  });
}
