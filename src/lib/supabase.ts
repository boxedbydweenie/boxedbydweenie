import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";

/** Browser client used by the admin area (staff sign in; row-level security decides what they may touch). */
let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "bbd-admin-auth" } });
  return client;
}

/** Separate browser client for customers, so a customer sign-in never mixes with a staff sign-in. */
let cust: SupabaseClient | null = null;
export function customerClient(): SupabaseClient {
  cust ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "bbd-customer-auth" } });
  return cust;
}
