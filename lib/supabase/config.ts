/** PostgREST / Supabase schema where app tables live */
export const SUPABASE_DB_SCHEMA = "public" as const;

export const PAGES_DATABASE_TABLE = "pages_database" as const;

export function supabaseClientOptions() {
  return {
    db: { schema: SUPABASE_DB_SCHEMA },
  };
}
