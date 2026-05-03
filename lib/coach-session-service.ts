import { getSupabaseBrowserClient, isE2EAuthEnabled } from "@/lib/supabase";

export type CoachMessageRole = "user" | "assistant";

export interface CoachSessionMessage {
  sessionId: string;
  role: CoachMessageRole;
  content: string;
  createdAt: string;
}

export interface CoachSessionSummary {
  sessionId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
}

interface CoachMemoryRow {
  session_id: string;
  role: CoachMessageRole;
  content: string;
  metadata?: { source?: string; title?: string } | null;
  created_at: string;
}

const E2E_COACH_MESSAGES_KEY = "caasy-e2e-coach-messages";

function readE2ECoachMessages() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(E2E_COACH_MESSAGES_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CoachMemoryRow[];
  } catch {
    return [];
  }
}

function writeE2ECoachMessages(messages: CoachMemoryRow[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(E2E_COACH_MESSAGES_KEY, JSON.stringify(messages));
  }
}

function titleFromContent(content: string) {
  const title = content.replace(/\s+/g, " ").trim();
  if (!title) return "Coaching session";
  return title.length > 56 ? `${title.slice(0, 55)}...` : title;
}

function summarizeRows(rows: CoachMemoryRow[]): CoachSessionSummary[] {
  const bySession = new Map<string, CoachMemoryRow[]>();
  rows.forEach((row) => {
    if (row.metadata?.source && row.metadata.source !== "coach_me_chat") return;
    const current = bySession.get(row.session_id) || [];
    current.push(row);
    bySession.set(row.session_id, current);
  });

  return Array.from(bySession.entries())
    .map(([sessionId, sessionRows]) => {
      const sorted = [...sessionRows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstUserMessage = sorted.find((row) => row.role === "user");
      const latest = sorted[sorted.length - 1];
      return {
        sessionId,
        title: firstUserMessage?.metadata?.title || titleFromContent(firstUserMessage?.content || latest?.content || ""),
        lastMessage: latest?.content || "",
        messageCount: sorted.length,
        updatedAt: latest?.created_at || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function saveCoachMessage(
  userId: string,
  sessionId: string,
  role: CoachMessageRole,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const row = {
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    metadata: { source: "coach_me_chat", ...metadata },
  };

  if (isE2EAuthEnabled()) {
    const messages = readE2ECoachMessages();
    messages.push({
      session_id: sessionId,
      role,
      content,
      metadata: row.metadata as CoachMemoryRow["metadata"],
      created_at: new Date().toISOString(),
    });
    writeE2ECoachMessages(messages);
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.schema("caasy").from("agent_memories").insert(row);

  if (error) {
    console.error("Unable to save Coach Me message", error);
  }
}

export async function getCoachSessions(limit = 20): Promise<CoachSessionSummary[]> {
  if (isE2EAuthEnabled()) {
    return summarizeRows(readE2ECoachMessages()).slice(0, limit);
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("caasy")
    .from("agent_memories")
    .select("session_id, role, content, metadata, created_at")
    .contains("metadata", { source: "coach_me_chat" })
    .order("created_at", { ascending: false })
    .limit(400)
    .returns<CoachMemoryRow[]>();

  if (error) {
    console.error("Unable to load Coach Me sessions", error);
    return [];
  }

  return summarizeRows(data || []).slice(0, limit);
}

export async function getCoachSessionMessages(sessionId: string): Promise<CoachSessionMessage[]> {
  if (isE2EAuthEnabled()) {
    return readE2ECoachMessages()
      .filter((row) => row.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((row) => ({
        sessionId: row.session_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
      }));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("caasy")
    .from("agent_memories")
    .select("session_id, role, content, created_at")
    .eq("session_id", sessionId)
    .contains("metadata", { source: "coach_me_chat" })
    .order("created_at", { ascending: true })
    .returns<CoachMemoryRow[]>();

  if (error) {
    console.error("Unable to load Coach Me messages", error);
    return [];
  }

  return (data || []).map((row) => ({
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}
