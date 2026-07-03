import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

let client: SupabaseClient | null = null;

export function isCloudConfigured(): boolean {
  return Boolean(url && key);
}

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured()) return null;
  if (!client) client = createClient(url, key);
  return client;
}

/** Snapshot of a user's full app state stored in the cloud. */
export interface UserSnapshot {
  user_id: string;
  email: string;
  display_name: string;
  provider: string;
  data: Record<string, unknown>;
  updated_at: string;
}
