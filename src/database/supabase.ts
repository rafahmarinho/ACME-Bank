import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let browserClient: SupabaseClient | null = null;
export const cloudEnabled = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
export function supabase() {
  if (!cloudEnabled)
    throw new Error(
      "Supabase is not configured. You are using the local demo.",
    );
  browserClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return browserClient;
}
