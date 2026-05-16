import { supabaseClientOptions } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only jobs (seeding). Bypasses RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, {
    ...supabaseClientOptions(),
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
