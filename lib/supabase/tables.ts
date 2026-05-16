import type { SupabaseClient } from "@supabase/supabase-js";
import { PAGES_DATABASE_TABLE, SUPABASE_DB_SCHEMA } from "@/lib/supabase/config";

/** Query `public.pages_database` with an explicit schema (avoids wrong-schema lookups). */
export function pagesDatabaseTable(client: SupabaseClient) {
  return client.schema(SUPABASE_DB_SCHEMA).from(PAGES_DATABASE_TABLE);
}

export function logSupabaseError(context: string, error: { message: string; code?: string; details?: string; hint?: string }) {
  console.error(
    `[${context}]`,
    error.message,
    error.code ? `(code: ${error.code})` : "",
    error.hint ? `hint: ${error.hint}` : "",
    error.details ?? ""
  );
}
