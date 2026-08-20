export function getPublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return Boolean(url && anonKey);
}

export function isGeminiMockMode() {
  return process.env.USE_GEMINI_MOCK === "true" || !process.env.GEMINI_API_KEY;
}
