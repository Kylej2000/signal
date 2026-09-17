import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config, hasSupabase, hasSupabaseAdmin } from "@/lib/config";

/**
 * Read-only server client (anon key). Used for public data fetching in server
 * components and public API routes.
 */
export function getServerClient(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  return createClient(config.supabase.url!, config.supabase.anonKey!, {
    auth: { persistSession: false },
  });
}

/**
 * Privileged server client (service role key). ONLY import this from server
 * code (API routes / server actions). It bypasses RLS and must never reach the
 * browser. Used for ingestion writes.
 */
export function getAdminClient(): SupabaseClient | null {
  if (!hasSupabaseAdmin()) return null;
  return createClient(config.supabase.url!, config.supabase.serviceRoleKey!, {
    auth: { persistSession: false },
  });
}
