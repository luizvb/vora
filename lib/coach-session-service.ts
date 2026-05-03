import { getSupabaseBrowserClient, isE2EAuthEnabled } from "@/lib/supabase";

export async function saveCoachMessage(userId: string, sessionId: string, role: "user" | "assistant", content: string) {
  if (isE2EAuthEnabled()) return;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.schema("caasy").from("agent_memories").insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    metadata: { source: "coach_me_chat" },
  });

  if (error) {
    console.error("Unable to save Coach Me message", error);
  }
}
