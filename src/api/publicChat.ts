/**
 * Shared public chat — all users see and post to one room (Supabase-backed).
 * Uses dedicated table when available; falls back to a community snapshot row.
 */

import { getSupabase, isCloudConfigured } from "../lib/supabase";
import type { PublicChatMessage } from "../types";

const TABLE = "public_chat_messages";
const ROOM_ID = "__zalife_public_chat__";
const MAX_LEN = 500;
const PAGE_SIZE = 120;

let dedicatedTable: boolean | null = null;

export function isPublicChatConfigured(): boolean {
  return isCloudConfigured();
}

function isAuthError(message: string, code?: string): boolean {
  const m = message.toLowerCase();
  return (
    code === "PGRST301" ||
    m.includes("no api key") ||
    m.includes("invalid api key") ||
    m.includes("invalid jwt") ||
    m.includes("jwt") ||
    m.includes("unauthorized") ||
    m.includes("401")
  );
}

function friendlyError(message: string, code?: string): string {
  if (isAuthError(message, code)) {
    return "Supabase ključ ni nastavljen na produkciji. V Vercel dodaj VITE_SUPABASE_URL in VITE_SUPABASE_ANON_KEY, nato ponovno deployaj.";
  }
  return message;
}

async function detectDedicatedTable(): Promise<boolean> {
  if (dedicatedTable !== null) return dedicatedTable;
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from(TABLE).select("id").limit(1);
  if (!error) {
    dedicatedTable = true;
    return true;
  }
  if (error.code === "PGRST205") {
    dedicatedTable = false;
    return false;
  }
  if (isAuthError(error.message, error.code)) {
    dedicatedTable = false;
    return false;
  }
  // Unknown error — assume table missing and use snapshot fallback.
  dedicatedTable = false;
  return false;
}

function parseSnapshotMessages(data: unknown): PublicChatMessage[] {
  const messages = (data as { messages?: PublicChatMessage[] } | null)?.messages;
  return Array.isArray(messages) ? messages : [];
}

async function fetchFromSnapshot(): Promise<{
  messages: PublicChatMessage[];
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { messages: [], error: "No Supabase client" };
  const { data, error } = await sb
    .from("user_snapshots")
    .select("data")
    .eq("user_id", ROOM_ID)
    .maybeSingle();
  if (error) {
    console.error("[publicChat] snapshot fetch failed", error.message);
    return { messages: [], error: friendlyError(error.message, error.code) };
  }
  return { messages: parseSnapshotMessages(data?.data) };
}

export async function fetchPublicChatMessages(): Promise<PublicChatMessage[]> {
  if (!isCloudConfigured()) return [];
  if (await detectDedicatedTable()) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(PAGE_SIZE);
    if (error) {
      console.error("[publicChat] fetch failed", error.message);
      if (isAuthError(error.message, error.code)) return [];
      const fallback = await fetchFromSnapshot();
      return fallback.messages;
    }
    return (data ?? []) as PublicChatMessage[];
  }
  const fallback = await fetchFromSnapshot();
  return fallback.messages;
}

async function sendToDedicatedTable(row: {
  user_id: string;
  display_name: string;
  avatar_url: string;
  content: string;
}): Promise<{ msg: PublicChatMessage | null; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { msg: null, error: "No Supabase client" };
  const { data, error } = await sb.from(TABLE).insert(row).select().single();
  if (error) {
    return { msg: null, error: friendlyError(error.message, error.code) };
  }
  return { msg: data as PublicChatMessage };
}

async function sendToSnapshot(row: {
  user_id: string;
  display_name: string;
  avatar_url: string;
  content: string;
}): Promise<{ msg: PublicChatMessage | null; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { msg: null, error: "No Supabase client" };

  const newMsg: PublicChatMessage = {
    id: crypto.randomUUID(),
    user_id: row.user_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    content: row.content,
    created_at: new Date().toISOString(),
  };

  let lastError = "Snapshot write failed after retries";
  for (let attempt = 0; attempt < 4; attempt++) {
    const existing = await fetchFromSnapshot();
    if (existing.error && isAuthError(existing.error)) {
      return { msg: null, error: existing.error };
    }
    const messages = [...existing.messages, newMsg].slice(-PAGE_SIZE);
    const { error } = await sb.from("user_snapshots").upsert(
      {
        user_id: ROOM_ID,
        email: "community@zalife.app",
        display_name: "Skupinski klepet",
        provider: "system",
        data: { messages },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (!error) return { msg: newMsg };
    lastError = friendlyError(error.message, error.code);
    if (isAuthError(error.message, error.code)) break;
    await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
  }
  return { msg: null, error: lastError };
}

export async function sendPublicChatMessage(input: {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  content: string;
}): Promise<{ msg: PublicChatMessage | null; error?: string }> {
  if (!isCloudConfigured()) {
    return { msg: null, error: "Supabase not configured" };
  }
  const content = input.content.trim().slice(0, MAX_LEN);
  if (!content) return { msg: null, error: "Empty message" };

  const row = {
    user_id: input.userId,
    display_name: input.displayName.trim() || "Voditelj",
    avatar_url: input.avatarUrl?.trim() ?? "",
    content,
  };

  if (await detectDedicatedTable()) {
    const result = await sendToDedicatedTable(row);
    if (result.msg) return result;
    if (result.error && isAuthError(result.error)) return result;
    dedicatedTable = false;
  }
  return sendToSnapshot(row);
}

/** Live updates. Returns an unsubscribe function. */
export function subscribePublicChat(
  onMessage: (msg: PublicChatMessage) => void,
  onRefresh?: () => void
): () => void {
  if (!isCloudConfigured()) return () => {};
  const sb = getSupabase();
  if (!sb) return () => {};

  let channel = sb.channel(`public-chat-${Date.now()}`);

  void detectDedicatedTable().then((useTable) => {
    if (useTable) {
      channel = channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE },
        (payload) => {
          const msg = payload.new as PublicChatMessage;
          if (msg?.id) onMessage(msg);
        }
      );
    } else {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_snapshots",
          filter: `user_id=eq.${ROOM_ID}`,
        },
        () => onRefresh?.()
      );
    }
    channel.subscribe();
  });

  return () => {
    void sb.removeChannel(channel);
  };
}

/** Quick connectivity check — surfaces auth misconfiguration early. */
export async function probePublicChatAuth(): Promise<string | null> {
  if (!isCloudConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { error } = await sb.from("user_snapshots").select("user_id").limit(1);
  if (!error) return null;
  return friendlyError(error.message, error.code);
}
