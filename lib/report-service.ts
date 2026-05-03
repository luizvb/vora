import type { UserRole } from "@/app/context/UserContext";
import type { AgentResponse } from "@/lib/langchain/agents";
import { getSupabaseBrowserClient, isE2EAuthEnabled } from "@/lib/supabase";

export interface Report {
  id: string;
  userId: string;
  mode: "coach_call" | "coach_me";
  transcript: string;
  overallScore: number;
  pros: { quote: string; analysis: string }[];
  cons: { quote: string; analysis: string }[];
  linguisticStats: {
    fillerWords: number;
    tone: string;
    talkTime: number;
  };
  actionPlan: { title: string; description: string; priority: "high" | "medium" | "low" }[];
  createdAt: string;
}

export interface AnalysisPayload {
  id?: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  overallScore: number;
  pros: Report["pros"];
  cons: Report["cons"];
  linguisticStats: Report["linguisticStats"];
  actionPlan: Report["actionPlan"];
  agentDetails?: AgentResponse[];
}

interface ReportRow {
  id: string;
  user_id: string;
  mode: "coach_call" | "coach_me";
  transcript: string;
  overall_score: number;
  pros: Report["pros"];
  cons: Report["cons"];
  linguistic_stats: Report["linguisticStats"];
  action_plan: Report["actionPlan"];
  created_at: string;
}

type StoredReport = ReportRow & {
  session_id: string;
  metadata?: unknown;
};

const e2eReports: StoredReport[] = [];
const E2E_REPORTS_KEY = "caasy-e2e-reports";

function readE2EReports() {
  if (typeof window === "undefined") return e2eReports;
  const raw = window.localStorage.getItem(E2E_REPORTS_KEY);
  if (!raw) return e2eReports;

  try {
    return JSON.parse(raw) as StoredReport[];
  } catch {
    return e2eReports;
  }
}

function writeE2EReports(reports: StoredReport[]) {
  e2eReports.splice(0, e2eReports.length, ...reports);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(E2E_REPORTS_KEY, JSON.stringify(reports));
  }
}

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    userId: row.user_id,
    mode: row.mode,
    transcript: row.transcript,
    overallScore: row.overall_score,
    pros: row.pros || [],
    cons: row.cons || [],
    linguisticStats: row.linguistic_stats,
    actionPlan: row.action_plan || [],
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (isE2EAuthEnabled()) return null;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

function caasyDb(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) {
  return supabase.schema("caasy");
}

export async function saveAgentMemory(
  sessionId: string,
  userId: string,
  role: string,
  content: string,
  metadata?: unknown
): Promise<void> {
  if (isE2EAuthEnabled()) return;

  const supabase = requireSupabase();
  if (!supabase) return;

  const { error } = await caasyDb(supabase).from("agent_memories").insert({
    session_id: sessionId,
    user_id: userId,
    role,
    content,
    metadata: metadata || {},
  });

  if (error) throw error;
}

export async function createReport(
  userId: string,
  _role: UserRole,
  transcript: string,
  analysisData: AnalysisPayload,
  mode: Report["mode"] = "coach_call"
): Promise<string> {
  const supabase = requireSupabase();
  const sessionId = analysisData.sessionId || crypto.randomUUID();
  const reportId = analysisData.id || crypto.randomUUID();

  if (isE2EAuthEnabled()) {
    const reports = readE2EReports();
    reports.unshift({
      id: reportId,
      user_id: userId,
      session_id: sessionId,
      mode,
      transcript,
      overall_score: analysisData.overallScore,
      pros: analysisData.pros,
      cons: analysisData.cons,
      linguistic_stats: analysisData.linguisticStats,
      action_plan: analysisData.actionPlan,
      metadata: { agentDetails: analysisData.agentDetails || [] },
      created_at: new Date().toISOString(),
    });
    writeE2EReports(reports);
    return reportId;
  }

  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await caasyDb(supabase).from("coaching_sessions").insert({
    id: reportId,
    user_id: userId,
    session_id: sessionId,
    mode,
    transcript,
    overall_score: analysisData.overallScore,
    pros: analysisData.pros,
    cons: analysisData.cons,
    linguistic_stats: analysisData.linguisticStats,
    action_plan: analysisData.actionPlan,
    metadata: {
      agentDetails: analysisData.agentDetails || [],
    },
  });

  if (error) throw error;

  if (analysisData.agentDetails?.length) {
    await Promise.all(
      analysisData.agentDetails.map((agentRes) =>
        saveAgentMemory(sessionId, userId, agentRes.agent, agentRes.feedback, agentRes.metrics)
      )
    );
  }

  return reportId;
}

export async function getReportById(id: string): Promise<Report | null> {
  if (isE2EAuthEnabled()) {
    const row = readE2EReports().find((report) => report.id === id);
    return row ? toReport(row) : null;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await caasyDb(supabase)
    .from("coaching_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle<ReportRow>();

  if (error) throw error;
  return data ? toReport(data) : null;
}

export async function getRecentReports(limit = 20): Promise<Report[]> {
  if (isE2EAuthEnabled()) {
    return readE2EReports().slice(0, limit).map(toReport);
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await caasyDb(supabase)
    .from("coaching_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ReportRow[]>();

  if (error) throw error;
  return (data || []).map(toReport);
}
